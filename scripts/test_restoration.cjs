const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function testRestore() {
  const inputPath = path.join(__dirname, '../public/samples/vintage_mother_child.jpg');
  const outputPath = path.join(__dirname, '../public/samples/vintage_mother_child_restored.jpg');

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const pixels = new Uint8ClampedArray(data);

  console.log(`Processing image ${width}x${height}, channels: ${channels}`);

  // Step 1: Detect luminance and min/max
  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < pixels.length; i += channels) {
    const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  // Step 2: Severe Peeling & White Flake Inpainting
  // A 5x5 window median replacement for pixels that are white peeled flakes
  const copy = new Uint8ClampedArray(pixels);
  const radius = 2; // 5x5 window

  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * channels;
      const r = copy[idx];
      const g = copy[idx + 1];
      const b = copy[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Sample surrounding neighborhood
      let sumSurrounding = 0;
      let minSurrounding = 255;
      let count = 0;
      const neighbors = [];

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = ((y + dy) * width + (x + dx)) * channels;
          const nLum = 0.299 * copy[nIdx] + 0.587 * copy[nIdx + 1] + 0.114 * copy[nIdx + 2];
          neighbors.push(nLum);
          sumSurrounding += nLum;
          if (nLum < minSurrounding) minSurrounding = nLum;
          count++;
        }
      }

      neighbors.sort((a, b) => a - b);
      const medianLum = neighbors[Math.floor(count / 2)];

      // White peeling spot detection:
      // If pixel is significantly brighter than surrounding median (white flaking on saree/wall)
      const isFaceArea = (y < height * 0.45 && x > width * 0.25 && x < width * 0.75); // Protect facial highlights
      const threshold = isFaceArea ? 65 : 35;

      if (lum - medianLum > threshold && lum > 110) {
        // Inpaint: blend towards local median
        const blendFactor = Math.min(0.9, (lum - medianLum) / 70);
        for (let c = 0; c < 3; c++) {
          pixels[idx + c] = Math.round(pixels[idx + c] * (1 - blendFactor) + (medianLum * (blendFactor)));
        }
      }
    }
  }

  // Step 3: Contrast Stretching & Tone Recovery (Black point restoration)
  const stretchSpan = Math.max(1, maxLum - minLum);
  for (let i = 0; i < pixels.length; i += channels) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    // Restore deep blacks and stretch dynamic range
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;
    let norm = (lum - minLum) / stretchSpan;
    // S-curve contrast boost
    let enhanced = norm < 0.5 ? 2 * norm * norm : 1 - 2 * (1 - norm) * (1 - norm);
    let target = enhanced * 255;

    r = r * 0.3 + target * 0.7;
    g = g * 0.3 + target * 0.7;
    b = b * 0.3 + target * 0.7;

    pixels[i] = Math.max(0, Math.min(255, r));
    pixels[i + 1] = Math.max(0, Math.min(255, g));
    pixels[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Step 4: Bengali Vintage Colorization (Skin tones, deep royal saree, background ambiance)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      let r = pixels[idx];
      let g = pixels[idx + 1];
      let b = pixels[idx + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Detect face / body skin regions (upper central areas)
      const isMotherFace = (y > height * 0.05 && y < height * 0.20 && x > width * 0.25 && x < width * 0.55);
      const isBabyFace = (y > height * 0.08 && y < height * 0.25 && x > width * 0.55 && x < width * 0.85);
      const isArmArea = (y > height * 0.28 && y < height * 0.40 && x > width * 0.35 && x < width * 0.75);

      if (isMotherFace || isBabyFace || isArmArea) {
        // Natural South Asian warm glowing skin tone
        const skinFactor = 1.15;
        r = gray * 1.25 + 15;
        g = gray * 1.05 + 5;
        b = gray * 0.88 - 5;
      } else if (y > height * 0.16 && y < height * 0.92 && x > width * 0.15 && x < width * 0.85) {
        // Saree fabric area: give rich deep crimson / maroon or royal indigo undertone
        if (gray < 90) {
          // Deep shadows of saree
          r = gray * 1.20 + 8;
          g = gray * 0.88;
          b = gray * 0.92;
        } else if (gray < 160) {
          // Saree midtones: rich maroon/burgundy
          r = gray * 1.28 + 12;
          g = gray * 0.85;
          b = gray * 0.82;
        } else {
          // Child's shirt or saree border highlights
          r = gray * 1.08;
          g = gray * 1.05;
          b = gray * 0.96;
        }
      } else {
        // Background and floor: warm vintage studio backdrop
        r = gray * 1.06 + 4;
        g = gray * 0.98;
        b = gray * 0.90 - 4;
      }

      pixels[idx] = Math.max(0, Math.min(255, r));
      pixels[idx + 1] = Math.max(0, Math.min(255, g));
      pixels[idx + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Step 5: Save with sharp, applying unsharp mask for crystal clear eyes and facial sharpness
  await sharp(Buffer.from(pixels), {
    raw: { width, height, channels }
  })
    .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7 })
    .jpeg({ quality: 95 })
    .toFile(outputPath);

  console.log('Restoration complete! Output saved to:', outputPath);
}

testRestore().catch(console.error);
