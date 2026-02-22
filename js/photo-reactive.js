/**
 * Photo-Reactive World Generator for LiveCard Studio
 * Vanilla JS, Canvas 2D, no external libraries.
 */

const SAMPLE_SIZE = 50;
const K = 5;
const KMEANS_ITERATIONS = 10;

function sampleImagePixels(img) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  return pixels;
}

function sqDist(a, b) {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

function kMeansDominantColors(pixels) {
  if (!pixels.length) return [];
  const n = pixels.length;
  const indices = new Set();
  while (indices.size < Math.min(K, n)) {
    indices.add(Math.floor(Math.random() * n));
  }
  let centroids = Array.from(indices).map((i) => ({ ...pixels[i] }));
  let assignments = new Uint8Array(n);

  for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
    for (let i = 0; i < n; i++) {
      const p = pixels[i];
      let best = 0;
      let bestD = sqDist(p, centroids[0]);
      for (let k = 1; k < centroids.length; k++) {
        const d = sqDist(p, centroids[k]);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      assignments[i] = best;
    }
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < n; i++) {
      const k = assignments[i];
      const p = pixels[i];
      sums[k].r += p.r;
      sums[k].g += p.g;
      sums[k].b += p.b;
      sums[k].count += 1;
    }
    centroids = sums.map((s) =>
      s.count > 0
        ? { r: Math.round(s.r / s.count), g: Math.round(s.g / s.count), b: Math.round(s.b / s.count), count: s.count }
        : { r: 0, g: 0, b: 0, count: 0 }
    );
  }
  return centroids.filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
}

function extractDominantColors(image) {
  const pixels = sampleImagePixels(image);
  return kMeansDominantColors(pixels);
}

function analyzePalette(dominantColors) {
  if (!dominantColors.length) return { warmth: 0, brightness: 0.5, saturation: 0 };
  let warmthSum = 0, lumSum = 0, satSum = 0;
  for (const c of dominantColors) {
    warmthSum += (c.r - c.b) / 255;
    lumSum += (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
    satSum += (mx - mn) / 255;
  }
  const n = dominantColors.length;
  return {
    warmth: Math.max(-1, Math.min(1, (warmthSum / n) * 2)),
    brightness: lumSum / n,
    saturation: satSum / n,
  };
}

function toRgbStr(r, g, b) {
  return `${Math.round(r)},${Math.round(g)},${Math.round(b)}`;
}

function darken(r, g, b, factor) {
  return { r: r * factor, g: g * factor, b: b * factor };
}

function lighten(r, g, b, factor) {
  return {
    r: r + (255 - r) * factor,
    g: g + (255 - g) * factor,
    b: b + (255 - b) * factor,
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function generateWorldFromImage(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const dominantColors = extractDominantColors(img);
        if (dominantColors.length === 0) {
          reject(new Error('Could not extract colors from image'));
          return;
        }
        const { warmth, brightness, saturation } = analyzePalette(dominantColors);

        const sortedBySat = [...dominantColors].map((c) => {
          const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
          return { ...c, sat: (mx - mn) / 255 };
        });
        sortedBySat.sort((a, b) => a.sat - b.sat);
        const bgColor = sortedBySat[0];
        const light = brightness > 0.5;
        const l0 = lighten(bgColor.r, bgColor.g, bgColor.b, 0.8);
        const d0 = darken(bgColor.r, bgColor.g, bgColor.b, 0.4);
        const bg = light ? rgbToHex(l0.r, l0.g, l0.b) : rgbToHex(d0.r, d0.g, d0.b);

        const blobColors = dominantColors.slice(0, 3).map((c) => toRgbStr(c.r, c.g, c.b));
        const particleColors = dominantColors.slice(0, 5).map((c) => toRgbStr(c.r, c.g, c.b));

        let particleType = 'fall';
        if (warmth > 0.2) particleType = 'rise';
        else if (warmth < -0.2) particleType = 'float';

        let particleCount = 25;
        if (saturation > 0.4) particleCount = 40 + Math.floor(Math.random() * 11);
        else if (saturation < 0.2) particleCount = 15 + Math.floor(Math.random() * 6);

        resolve({
          bg,
          blobs: blobColors,
          particleType,
          particleCount,
          particleColors,
          light,
        });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

function createPhotoReactiveDemo(container) {
  let cardEl, inputEl, btnEl, dotsEl, loadingEl, thumbEl;
  let lastObjectUrl = null;

  function showLoading(show) {
    if (loadingEl) loadingEl.classList.toggle('visible', !!show);
    if (btnEl) btnEl.style.visibility = show ? 'hidden' : 'visible';
  }

  function showPalette(particleColors) {
    if (!dotsEl || !particleColors || !particleColors.length) return;
    dotsEl.innerHTML = '';
    particleColors.slice(0, 5).forEach((rgb) => {
      const dot = document.createElement('span');
      dot.className = 'photo-palette-dot';
      dot.style.background = `rgb(${rgb})`;
      dotsEl.appendChild(dot);
    });
  }

  function showThumbnail(file) {
    if (!thumbEl) return;
    if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
    lastObjectUrl = URL.createObjectURL(file);
    thumbEl.src = lastObjectUrl;
    thumbEl.hidden = false;
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    cardEl = container.querySelector('.live-card');
    if (!cardEl || typeof window.applyPhotoWorld !== 'function') return;
    showLoading(true);
    const minDelay = new Promise((r) => setTimeout(r, 1000));
    Promise.all([generateWorldFromImage(file), minDelay])
      .then(([config]) => {
        showLoading(false);
        showPalette(config.particleColors);
        showThumbnail(file);
        window.applyPhotoWorld(cardEl, config);
      })
      .catch(() => {
        showLoading(false);
      });
  }

  return {
    init(container) {
      cardEl = container.querySelector('.live-card');
      inputEl = container.querySelector('#photoInput');
      btnEl = container.querySelector('#photoUploadBtn');
      dotsEl = container.querySelector('#photoPaletteDots');
      loadingEl = container.querySelector('#photoLoading');
      thumbEl = container.querySelector('#photoThumbnail');
      if (!cardEl || !inputEl || !btnEl) return;

      btnEl.addEventListener('click', () => inputEl.click());
      inputEl.addEventListener('change', () => {
        const file = inputEl.files && inputEl.files[0];
        handleFile(file);
        inputEl.value = '';
      });

      cardEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      cardEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        handleFile(file);
      });
    },
    destroy() {
      if (lastObjectUrl) {
        URL.revokeObjectURL(lastObjectUrl);
        lastObjectUrl = null;
      }
      if (inputEl) inputEl.value = '';
      if (thumbEl) {
        thumbEl.removeAttribute('src');
        thumbEl.hidden = true;
      }
      if (dotsEl) dotsEl.innerHTML = '';
      showLoading(false);
      if (btnEl) btnEl.style.visibility = 'visible';
    },
  };
}

export {
  extractDominantColors,
  analyzePalette,
  generateWorldFromImage,
  createPhotoReactiveDemo,
  toRgbStr,
  darken,
  lighten,
};
