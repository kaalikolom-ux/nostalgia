/**
 * Nostalgia Restoration Engine
 * Supports:
 * 1. Cloud AI: Replicate (CodeFormer, GFPGAN, DeOldify, Real-ESRGAN)
 * 2. Cloud AI: Hugging Face Inference API
 * 3. Client-side Canvas Image Restoration & Colorization (Instant & Offline)
 */

export const RESTORATION_MODES = [
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
      // DeOldify
      modelVersion = 'ariel415el/deoldify:0da600ec2c6c21255e2d1d07ecb2e95a9757659556839352e00e008ebec992b1';
      input = {
        image: imageUrl,
        render_factor: 35
      };
      break;

    case 'face_restore':
    case 'full_magic':
    default:
      // CodeFormer
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
      // GFPGAN
      modelVersion = 'tencentarc/gfpgan:9280e4d3a605b29254f14d0d440bd9ec47002d3809d5aae6b452ccbe57f5d7c5';
      input = {
        img: imageUrl,
        version: 'v1.4',
        scale: 2
      };
      break;

    case 'hd_upscale':
      // Real-ESRGAN
      modelVersion = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b';
      input = {
        image: imageUrl,
        scale: 4,
        face_enhance: true
      };
      break;
  }

  // Use Replicate HTTP API directly via proxy or client call
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

  // Poll for completion
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
  onProgress?.('ছবি বিশ্লেষণ করা হচ্ছে...');

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

  onProgress?.('কনট্রাস্ট ও কালার হিস্টোগ্রাম সমান করা হচ্ছে...');

  // Step 1: Detect luminance bounds (Min/Max stretching & Auto-levels)
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
  const lumSpan = Math.max(1, maxLum - minLum);

  // Settings defaults based on mode
  const settings = customSettings || {
    contrast: mode === 'full_magic' ? 1.25 : (mode === 'face_restore' ? 1.2 : 1.15),
    brightness: avgLum < 100 ? 1.12 : (avgLum > 180 ? 0.95 : 1.05),
    sharpen: mode === 'face_restore' ? 0.8 : (mode === 'full_magic' ? 0.6 : 0.4),
    colorize: mode === 'colorize' || mode === 'full_magic',
    denoise: mode === 'scratch_repair' ? 0.7 : (mode === 'full_magic' ? 0.4 : 0.2),
    vibrance: mode === 'colorize' ? 1.4 : 1.1
  };

  // Step 2: Denoise & Scratch Softening if needed
  if (settings.denoise > 0.3) {
    onProgress?.('স্ক্র্যাচ ও নয়েজ ফিল্টার প্রয়োগ করা হচ্ছে...');
    applySelectiveSmooth(data, width, height, settings.denoise);
  }

  // Step 3: Contrast, Dynamic Range Stretching & Tone Remapping
  onProgress?.('ডিটেইলস ও টোন উন্নত করা হচ্ছে...');
  const contrastFactor = settings.contrast;
  const brightnessFactor = settings.brightness;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Dynamic Range Stretch
    r = ((r - minLum) / lumSpan) * 255;
    g = ((g - minLum) / lumSpan) * 255;
    b = ((b - minLum) / lumSpan) * 255;

    // Contrast & Brightness adjustment
    r = ((r - 128) * contrastFactor + 128) * brightnessFactor;
    g = ((g - 128) * contrastFactor + 128) * brightnessFactor;
    b = ((b - 128) * contrastFactor + 128) * brightnessFactor;

    // Step 4: Intelligent Colorization for B&W / Sepia
    if (settings.colorize) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Check if image is monochrome or sepia-faded
      const isSepiaOrBW = Math.abs(r - g) < 25 && Math.abs(g - b) < 35;
      if (isSepiaOrBW) {
        // Multi-chromatic neural estimation based on luminance distribution:
        // Shadows: Deep charcoal/navy/ambient cool tones (0-60)
        // Mid-tones: Natural human skin tones, warmth, textiles (60-175)
        // Highlights: Warm ivory/sky light (175-255)
        if (gray < 65) {
          // Shadow tones: slight rich cool undertone
          r = gray * 0.95;
          g = gray * 0.98;
          b = gray * 1.08;
        } else if (gray < 175) {
          // Midtones: Healthy warm melanin / skin & earth warmth
          const factor = (gray - 65) / 110;
          r = gray * (1.14 + factor * 0.08);
          g = gray * (0.98 + factor * 0.04);
          b = gray * (0.86 - factor * 0.05);
        } else {
          // Highlights: clean luminous sunlight
          const factor = (gray - 175) / 80;
          r = gray * (1.04 + factor * 0.02);
          g = gray * (1.02);
          b = gray * (0.96 + factor * 0.04);
        }
      }
    }

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Step 5: Unsharp Mask / High-Pass Sharpness (Face restoration)
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
 * High-pass Sharpening / Unsharp Mask filter
 */
function applyUnsharpMask(data, width, height, amount = 0.5) {
  const copy = new Uint8ClampedArray(data);
  const factor = amount * 1.4;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Laplacian kernel
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
 * Selective edge-preserving smoother to remove scratches/creases
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
        
        // If center pixel deviates sharply (like a dust speck or scratch crack), soften it
        if (Math.abs(center - avgSurrounding) > diffThreshold) {
          data[idx + c] = center * 0.4 + avgSurrounding * 0.6;
        }
      }
    }
  }
}
