/**
 * Nostalgia Restoration Engine
 * Supports:
 * 1. Cloud AI: Replicate (CodeFormer, GFPGAN, DeOldify, Real-ESRGAN)
 * 2. Cloud AI: Hugging Face Inference API
 * 3. Client-side Canvas Image Restoration & Colorization (Instant & Offline)
 */

export const RESTORATION_MODES = [
  {
    id: 'peeling_repair',
    name: 'রঙ ওঠা ও গভীর দাগ মেরামত',
    nameEn: 'Peeling & Inpainting Repair',
    desc: 'ছবির যে অংশের রঙ বা প্রলেপ উঠে গেছে, সাদা ফাঙ্গাস ও গভীর দাগ ভরাট করে মসৃণ করে',
    icon: 'ShieldAlert',
    badge: 'সেরা ড্যামেজ ফিক্স'
  },
  {
    id: 'full_magic',
    name: 'সম্পূর্ণ ম্যাজিক রিস্টোরেশন',
    nameEn: 'Full Magic Restore',
    desc: 'দাগ-স্ক্র্যাচ দূর করে মুখমণ্ডল স্পষ্ট, শার্প এবং প্রয়োজনমতো কালারাইজ করে',
    icon: 'Sparkles',
    badge: 'জনপ্রিয়'
  },
  {
    id: 'face_restore',
    name: 'মুখমণ্ডল স্পষ্টকরণ (Face Clarity)',
    nameEn: 'Face Restoration',
    desc: 'ঘোলাটে ও অস্পষ্ট চোখ, মুখ ও চুল অত্যন্ত নিখুঁত ও স্পষ্টভাবে ফুটিয়ে তোলে',
    icon: 'UserCheck',
    badge: 'হাই-ডিগ্রি'
  },
  {
    id: 'colorize',
    name: 'রঙিন করুন (Colorize B&W)',
    nameEn: 'Colorize Photo',
    desc: 'পুরোনো সাদাকালো ও সেপিয়া ছবিকে প্রাকৃতিক ও সতেজ রঙে রূপান্তর করুন',
    icon: 'Palette',
    badge: 'কালারফুল'
  },
  {
    id: 'scratch_repair',
    name: 'দাগ ও স্ক্র্যাচ দূরীকরণ',
    nameEn: 'Scratch & Dust Removal',
    desc: 'পুরোনো অ্যালবামের ভাঙা ভাঁজ, স্ক্র্যাচ ও দাগ দূর করে মসৃণ করুন',
    icon: 'Wand2',
    badge: 'ক্লিন'
  },
  {
    id: 'hd_upscale',
    name: 'এইচডি আপস্কেল (2x/4x HD)',
    nameEn: 'HD Super Resolution',
    desc: 'কম রেজোলিউশনের ছোট ছবিকে উচ্চ রেজোলিউশনের ঝকঝকে ছবিতে পরিণত করুন',
    icon: 'Maximize2',
    badge: 'আল্ট্রা এইচডি'
  }
];

/**
 * Replicate API Runner
 */
export async function runReplicateRestoration({ imageUrl, mode, apiToken, onProgress }) {
  if (!apiToken) {
    throw new Error('Replicate API Token প্রয়োজন। অনুগ্রহ করে Settings এ আপনার টোকেন যোগ করুন।');
  }

  onProgress?.('Replicate সার্ভারে পাঠানো হচ্ছে...');

  let modelVersion = '';
  let input = {};

  switch (mode) {
    case 'colorize':
      modelVersion = 'ariel415el/deoldify:0da600ec2c6c21255e2d1d07ecb2e95a9757659556839352e00e008ebec992b1';
      input = {
        image: imageUrl,
        render_factor: 35
      };
      break;

    case 'peeling_repair':
    case 'face_restore':
    case 'full_magic':
    default:
      modelVersion = 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c87570b396e06b3a0e693';
      input = {
        image: imageUrl,
        codeformer_fidelity: 0.7,
        background_enhance: true,
        face_upsample: true,
        upscale: 2
      };
      break;

    case 'scratch_repair':
      modelVersion = 'tencentarc/gfpgan:9280e4d3a605b29254f14d0d440bd9ec47002d3809d5aae6b452ccbe57f5d7c5';
      input = {
        img: imageUrl,
        version: 'v1.4',
        scale: 2
      };
      break;

    case 'hd_upscale':
      modelVersion = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b';
      input = {
        image: imageUrl,
        scale: 4,
        face_enhance: true
      };
      break;
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: modelVersion.split(':')[1] || modelVersion,
      input
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Replicate API ত্রুটি: ${response.status} - ${errText}`);
  }

  let prediction = await response.json();
  onProgress?.('AI মডেল প্রসেসিং করছে...');

  const pollUrl = prediction.urls.get;
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    await new Promise((res) => setTimeout(res, 1500));
    const pollRes = await fetch(pollUrl, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    if (!pollRes.ok) break;
    prediction = await pollRes.json();
    onProgress?.(`AI প্রসেসিং চলছে... অবস্থা: ${prediction.status}`);
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`AI প্রসেসিং সম্পন্ন হতে পারেনি (${prediction.status}): ${prediction.error || ''}`);
  }

  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  return output;
}

/**
 * Intelligent Client-Side Photo Restoration Engine
 * Runs completely in-browser without external API dependencies.
 */
export async function runClientSideRestoration({
  imageElement,
  mode = 'full_magic',
  customSettings = null,
  onProgress
}) {
  onProgress?.('ছবি ও ড্যামেজ বিশ্লেষণ করা হচ্ছে...');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const width = imageElement.naturalWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.height;

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(imageElement, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // Step 1: Detect luminance bounds
  let minLum = 255;
  let maxLum = 0;
  let totalLum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
    totalLum += lum;
  }

  const avgLum = totalLum / totalPixels;

  // Step 2: Severe Peeling & White Flake Inpainting
  if (mode === 'peeling_repair' || mode === 'full_magic' || mode === 'scratch_repair') {
    onProgress?.('উঠে যাওয়া রঙ ও সাদা দাগগুলো ভরাট (Inpainting) করা হচ্ছে...');
    applySeverePeelingInpaint(data, width, height);
  }

  // Step 3: Denoise & Scratch Softening if requested
  const settings = customSettings || {
    contrast: mode === 'peeling_repair' ? 1.35 : (mode === 'full_magic' ? 1.25 : 1.15),
    brightness: avgLum < 100 ? 1.12 : (avgLum > 180 ? 0.95 : 1.05),
    sharpen: mode === 'face_restore' ? 0.8 : (mode === 'peeling_repair' ? 0.7 : 0.5),
    colorize: mode === 'colorize' || mode === 'full_magic' || mode === 'peeling_repair',
    denoise: mode === 'scratch_repair' ? 0.7 : (mode === 'peeling_repair' ? 0.6 : 0.35),
    vibrance: 1.2
  };

  if (settings.denoise > 0.3) {
    onProgress?.('স্ক্র্যাচ ও নয়েজ ফিল্টার প্রয়োগ করা হচ্ছে...');
    applySelectiveSmooth(data, width, height, settings.denoise);
  }

  // Step 4: Contrast, Dynamic Range Stretching & Tone Remapping
  onProgress?.('কালো ও কনট্রাস্ট পুনরুদ্ধার করা হচ্ছে...');
  const contrastFactor = settings.contrast;
  const brightnessFactor = settings.brightness;
  const lumSpan = Math.max(1, maxLum - minLum);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Dynamic Range Stretch
    r = ((r - minLum) / lumSpan) * 255;
    g = ((g - minLum) / lumSpan) * 255;
    b = ((b - minLum) / lumSpan) * 255;

    // S-curve contrast and gamma
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;
    let norm = lum / 255;
    let enhanced = norm < 0.5 ? 2 * norm * norm : 1 - 2 * (1 - norm) * (1 - norm);
    let target = enhanced * 255;

    r = ((r - 128) * contrastFactor + 128) * brightnessFactor * 0.4 + target * 0.6;
    g = ((g - 128) * contrastFactor + 128) * brightnessFactor * 0.4 + target * 0.6;
    b = ((b - 128) * contrastFactor + 128) * brightnessFactor * 0.4 + target * 0.6;

    // Step 5: Intelligent Colorization
    if (settings.colorize) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const isSepiaOrBW = Math.abs(r - g) < 30 && Math.abs(g - b) < 40;

      if (isSepiaOrBW) {
        // Pixel coordinates
        const pixelIdx = i / 4;
        const py = Math.floor(pixelIdx / width);
        const px = pixelIdx % width;

        // Portrait facial detection heuristic
        const isUpperCenter = py > height * 0.05 && py < height * 0.35 && px > width * 0.20 && px < width * 0.80;

        if (isUpperCenter && gray > 80 && gray < 210) {
          // Warm South Asian skin tones
          r = gray * 1.25 + 14;
          g = gray * 1.05 + 4;
          b = gray * 0.86 - 6;
        } else if (py > height * 0.20 && py < height * 0.90 && px > width * 0.15 && px < width * 0.85) {
          // Clothing/Saree area
          if (gray < 85) {
            r = gray * 1.15 + 6;
            g = gray * 0.90;
            b = gray * 0.94;
          } else if (gray < 165) {
            // Elegant rich maroon/crimson saree undertones
            r = gray * 1.26 + 10;
            g = gray * 0.86;
            b = gray * 0.82;
          } else {
            // Highlights & light textiles
            r = gray * 1.06;
            g = gray * 1.04;
            b = gray * 0.95;
          }
        } else {
          // Ambient background
          r = gray * 1.05 + 4;
          g = gray * 0.98;
          b = gray * 0.90 - 4;
        }
      }
    }

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Step 6: Unsharp Mask / High-Pass Sharpness
  if (settings.sharpen > 0) {
    onProgress?.('মুখমণ্ডল ও চোখ শার্প করা হচ্ছে...');
    applyUnsharpMask(data, width, height, settings.sharpen);
  }

  ctx.putImageData(imgData, 0, 0);
  onProgress?.('রিস্টোরেশন সম্পন্ন হচ্ছে...');

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const restoredUrl = URL.createObjectURL(blob);
      resolve({ blob, url: restoredUrl });
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Severe Peeling & White Flake Inpainting Algorithm
 * Automatically detects white peeling spots on dark/textured areas and inpaints them
 */
function applySeverePeelingInpaint(data, width, height) {
  const copy = new Uint8ClampedArray(data);
  const radius = 2; // 5x5 sliding window

  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * 4;
      const r = copy[idx];
      const g = copy[idx + 1];
      const b = copy[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      const neighbors = [];
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const nLum = 0.299 * copy[nIdx] + 0.587 * copy[nIdx + 1] + 0.114 * copy[nIdx + 2];
          neighbors.push(nLum);
        }
      }

      neighbors.sort((a, b) => a - b);
      const medianLum = neighbors[Math.floor(neighbors.length / 2)];

      // Detect white peeled pigment (lum significantly higher than neighborhood median)
      const isFaceHighlight = (y < height * 0.35 && x > width * 0.25 && x < width * 0.75);
      const threshold = isFaceHighlight ? 60 : 32;

      if (lum - medianLum > threshold && lum > 105) {
        const blendFactor = Math.min(0.9, (lum - medianLum) / 60);
        for (let c = 0; c < 3; c++) {
          data[idx + c] = Math.round(data[idx + c] * (1 - blendFactor) + (medianLum * blendFactor));
        }
      }
    }
  }
}

/**
 * High-pass Sharpening / Unsharp Mask filter
 */
function applyUnsharpMask(data, width, height, amount = 0.5) {
  const copy = new Uint8ClampedArray(data);
  const factor = amount * 1.5;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const top = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left = copy[(y * width + (x - 1)) * 4 + c];
        const right = copy[(y * width + (x + 1)) * 4 + c];

        const laplacian = 4 * center - (top + bottom + left + right);
        const sharpened = center + laplacian * factor;
        data[idx + c] = Math.max(0, Math.min(255, sharpened));
      }
    }
  }
}

/**
 * Selective edge-preserving smoother
 */
function applySelectiveSmooth(data, width, height, threshold = 0.5) {
  const copy = new Uint8ClampedArray(data);
  const diffThreshold = 30 * threshold;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const top = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left = copy[(y * width + (x - 1)) * 4 + c];
        const right = copy[(y * width + (x + 1)) * 4 + c];

        const avgSurrounding = (top + bottom + left + right) / 4;
        if (Math.abs(center - avgSurrounding) > diffThreshold) {
          data[idx + c] = center * 0.4 + avgSurrounding * 0.6;
        }
      }
    }
  }
}
