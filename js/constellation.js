/**
 * Constellation Group Cards — "Every person becomes a star in your sky"
 * Contributor entries → stars on a dark sky, nebula, twinkle, batch lines,
 * shooting star, aurora, tap-to-reveal modal, export as image.
 *
 * Data: prototype uses localStorage; production would use backend API.
 * @see TODO comments for API replacement points.
 */

const EASE = 'cubic-bezier(.23, 1, .32, 1)';
const STORAGE_PREFIX = 'livecard_constellation_';
const META_PREFIX = 'livecard_constellation_meta_';
const BATCH_HOURS = 2;
const BATCH_MS = BATCH_HOURS * 60 * 60 * 1000;
const MIN_TAP_TARGET_PX = 44;
const TAP_TARGET_RADIUS_PX = MIN_TAP_TARGET_PX / 2;

// Nebula layers — subtle blobs
const NEBULA_LAYERS = [
  { r: 180, driftX: 0.02, driftY: 0.01, color: '40,25,80', alpha: 0.09, ph: 0 },
  { r: 220, driftX: -0.015, driftY: 0.018, color: '20,15,50', alpha: 0.07, ph: 2 },
  { r: 160, driftX: 0.01, driftY: -0.012, color: '55,30,95', alpha: 0.06, ph: 4 },
  { r: 200, driftX: -0.018, driftY: -0.008, color: '28,22,58', alpha: 0.08, ph: 1 },
  { r: 140, driftX: 0.012, driftY: 0.022, color: '35,20,65', alpha: 0.05, ph: 3 },
];

// Aurora — 2–3 translucent bands
const AURORA_COLORS = [
  { r: 80, g: 120, b: 100, a: 0.04 },
  { r: 100, g: 80, b: 130, a: 0.035 },
  { r: 60, g: 100, b: 110, a: 0.03 },
];

// Fallback sample data for demo when no cardId / empty storage
const SAMPLE_CONTRIBUTORS = [
  { id: '1', name: 'Maya', message: 'You light up every room.', color: '#E8D4A8', photoDataURL: null, timestamp: 0 },
  { id: '2', name: 'James', message: 'So proud of you.', color: '#A8C8E8', photoDataURL: null, timestamp: 0 },
  { id: '3', name: 'Sophie', message: 'Forever in our hearts.', color: '#E8B8C8', photoDataURL: null, timestamp: 1000 },
  { id: '4', name: 'Leo', message: 'To the stars and back.', color: '#A8E8D0', photoDataURL: null, timestamp: 1000 },
  { id: '5', name: 'Elena', message: 'With love always.', color: '#E8D4A8', photoDataURL: null, timestamp: 7200000 },
  { id: '6', name: 'Alex', message: 'Shine on.', color: '#D0B8E8', photoDataURL: null, timestamp: 7200000 },
  { id: '7', name: 'Jordan', message: 'So grateful for you.', color: '#A8C8E8', photoDataURL: null, timestamp: 7200000 },
  { id: '8', name: 'Riley', message: 'You are the best.', color: '#E8D4A8', photoDataURL: null, timestamp: 0 },
];

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 220, 200];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Sinusoidal twinkle: unique phase per star, returns multiplier ~0.5–1 */
function twinkle(phase, t) {
  const T = t * 0.001 + phase;
  return 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(T * 1.2));
}

/**
 * Load entries for a card. Prototype: localStorage. Production: TODO replace with API.
 */
function getEntries(cardId) {
  // TODO: Replace with API call, e.g. await fetch(`/api/cards/${cardId}/entries`) or Supabase/Firebase
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + (cardId || 'demo'));
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

/**
 * Load card meta (recipient name). Prototype: localStorage. Production: TODO replace with API.
 */
function getMeta(cardId) {
  // TODO: Replace with API call for card metadata
  try {
    const raw = localStorage.getItem(META_PREFIX + (cardId || 'demo'));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Create constellation card: full-page view or inline demo.
 * @param {Object} opts - options
 * @param {HTMLElement} opts.container - mount point
 * @param {string} [opts.cardId] - card id (undefined = demo with sample data)
 * @param {boolean} [opts.fullPage] - true = full viewport canvas + overlay header/toolbar
 * @param {Function} [opts.onReady] - called with { downloadConstellationAsImage } when canvas is ready
 */
export function createConstellationCard(opts = {}) {
  const { container, cardId, fullPage = false, onReady } = opts || {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let wrap = null;
  let cardEl = null;
  let canvas = null;
  let ctx = null;
  let rafId = null;
  let running = false;
  let contributors = [];
  let stars = [];
  let nebulaBlobs = [];
  let shootingStar = null;
  let nextShootingStarAt = 0;
  let modalEl = null;
  let selectedStarId = null;
  let tapCeremony = null;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let parallaxX = 0;
  let parallaxY = 0;

  const w0 = 400;
  const h0 = 560;
  const SKY_BG = '#0A0A14';
  const MARGIN = 0.1;
  const GRID_OFFSET_PX = 30;
  const SHOOTING_STAR_MIN_MS = 8000;
  const SHOOTING_STAR_MAX_MS = 15000;
  const SHOOTING_STAR_DURATION_MS = 500;

  function createDOM() {
    wrap = document.createElement('div');
    wrap.className = 'codex-constellation-wrap' + (fullPage ? ' codex-constellation-fullpage' : '');
    const recipientName = fullPage && cardId ? (getMeta(cardId)?.recipientName || 'you') : 'you';
    wrap.innerHTML = `
      <div class="codex-constellation-card" style="position:relative;width:100%;height:100%;min-height:${fullPage ? '100vh' : '360px'};border-radius:${fullPage ? '0' : '16px'};overflow:hidden;box-shadow:${fullPage ? 'none' : '0 24px 60px rgba(0,0,0,.35)'};">
        <canvas class="codex-constellation-canvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;cursor:pointer;"></canvas>
        <div class="codex-constellation-header" style="position:absolute;top:0;left:0;right:0;z-index:2;text-align:center;padding:20px 16px;pointer-events:none;">
          <div class="codex-constellation-title" style="font-family:'Cormorant Garamond',serif;font-size:${fullPage ? 'clamp(.9rem,2.5vw,1.1rem)' : '.75rem'};font-weight:300;letter-spacing:.25em;color:rgba(255,255,255,.75);">A constellation for ${escapeHtml(recipientName)}</div>
          <div class="codex-constellation-count" style="font-family:'DM Sans',sans-serif;font-size:${fullPage ? '.6rem' : '.5rem'};letter-spacing:.2em;color:rgba(255,255,255,.4);margin-top:6px;"><span class="constellation-n">0</span> stars shining for you</div>
        </div>
        <div class="codex-constellation-modal" style="display:none;position:absolute;inset:0;z-index:10;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
          <div class="codex-constellation-modal-inner" style="background:rgba(20,18,35,.95);border-radius:20px;padding:28px;max-width:280px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5);transform:scale(0.85);opacity:0;transition:transform 0.35s cubic-bezier(0.23,1,0.32,1),opacity 0.3s ease;">
            <div class="codex-constellation-modal-photo" style="width:80px;height:80px;border-radius:50%;margin:0 auto 14px;background:linear-gradient(135deg,rgba(201,169,110,.2),rgba(140,100,160,.2));overflow:hidden;background-size:cover;background-position:center;"></div>
            <div class="codex-constellation-modal-name" style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:400;color:rgba(255,255,255,.95);margin-bottom:6px;"></div>
            <p class="codex-constellation-modal-msg" style="font-family:'DM Sans',sans-serif;font-size:.75rem;font-weight:300;color:rgba(255,255,255,.65);line-height:1.6;margin-bottom:18px;"></p>
            <button type="button" class="codex-constellation-close" style="padding:8px 20px;border-radius:20px;border:1px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.7);font-size:.6rem;letter-spacing:.1em;cursor:pointer;">Close</button>
          </div>
        </div>
      </div>
    `;
    cardEl = wrap.querySelector('.codex-constellation-card');
    canvas = wrap.querySelector('.codex-constellation-canvas');
    modalEl = wrap.querySelector('.codex-constellation-modal');
    return wrap;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function loadContributors() {
    const raw = getEntries(cardId);
    if (raw && raw.length > 0) {
      contributors = raw.map((c) => ({
        id: c.id,
        name: c.name || 'Someone',
        message: c.message || '',
        photoDataURL: c.photoDataURL || null,
        color: c.color || '#E8D4A8',
        timestamp: typeof c.timestamp === 'number' ? c.timestamp : Date.now(),
      }));
    } else {
      contributors = SAMPLE_CONTRIBUTORS.map((c) => ({
        id: c.id,
        name: c.name,
        message: c.message,
        photoDataURL: c.photoDataURL || null,
        color: c.color || '#E8D4A8',
        timestamp: c.timestamp,
      }));
    }
  }

  /** Grid placement: 10% margin, grid by count, ±30px random offset per star */
  function initStars() {
    const n = contributors.length;
    if (n === 0) {
      stars = [];
      return;
    }
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const innerW = w0 * (1 - 2 * MARGIN);
    const innerH = h0 * (1 - 2 * MARGIN);
    const cellW = innerW / cols;
    const cellH = innerH / rows;

    stars = contributors.map((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (Math.random() - 0.5) * 2 * GRID_OFFSET_PX;
      const offsetY = (Math.random() - 0.5) * 2 * GRID_OFFSET_PX;
      const x = w0 * MARGIN + cellW * (col + 0.5) + offsetX;
      const y = h0 * MARGIN + cellH * (row + 0.5) + offsetY;
      const rgb = hexToRgb(c.color);
      const hasPhoto = !!(c.photoDataURL && c.photoDataURL.startsWith('data:'));
      const coreRadius = hasPhoto ? 4 + Math.random() * 2 : 2 + Math.random() * 2;
      const glowRadius = 15 + Math.random() * 10;
      return {
        id: c.id,
        x, y,
        color: rgb,
        hasPhoto,
        coreRadius,
        glowRadius,
        phase: Math.random() * Math.PI * 2,
        ts: c.timestamp,
      };
    });
  }

  function initNebula() {
    nebulaBlobs = NEBULA_LAYERS.map((layer) => ({
      ...layer,
      x: w0 * (0.3 + 0.4 * Math.random()),
      y: h0 * (0.2 + 0.6 * Math.random()),
    }));
  }

  function getContributor(id) {
    return contributors.find((c) => c.id === id) || null;
  }

  function resize() {
    if (!cardEl || !canvas) return;
    const r = cardEl.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawNebula(w, h, t) {
    const parX = parallaxX * w * 0.3;
    const parY = parallaxY * h * 0.3;
    nebulaBlobs.forEach((b) => {
      b.x += b.driftX + 0.008 * Math.sin(t * 0.0003 + b.ph);
      b.y += b.driftY + 0.006 * Math.cos(t * 0.00025 + b.ph);
      if (b.x < -b.r) b.x = w0 + b.r;
      if (b.x > w0 + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = h0 + b.r;
      if (b.y > h0 + b.r) b.y = -b.r;
      const scale = w / w0;
      const r = b.r * scale * (0.95 + 0.1 * Math.sin(t * 0.0004 + b.ph));
      const alpha = b.alpha * (0.7 + 0.3 * Math.sin(t * 0.0005 + b.ph));
      const gx = (b.x / w0) * w + parX;
      const gy = (b.y / h0) * h + parY;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(${b.color},${alpha})`);
      g.addColorStop(0.6, `rgba(${b.color},${alpha * 0.3})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function drawAurora(w, h, t) {
    const bandHeight = h * 0.18;
    AURORA_COLORS.slice(0, 3).forEach((ac, i) => {
      const phase = t * 0.00008 + i * 2;
      const drift = Math.sin(phase) * 4;
      const alpha = ac.a * (0.6 + 0.4 * Math.sin(phase * 0.7));
      const y = i * (bandHeight * 0.6) + drift;
      const grad = ctx.createLinearGradient(0, y, 0, y + bandHeight);
      grad.addColorStop(0, `rgba(${ac.r},${ac.g},${ac.b},0)`);
      grad.addColorStop(0.3, `rgba(${ac.r},${ac.g},${ac.b},${alpha})`);
      grad.addColorStop(0.7, `rgba(${ac.r},${ac.g},${ac.b},${alpha})`);
      grad.addColorStop(1, `rgba(${ac.r},${ac.g},${ac.b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, bandHeight + 40);
    });
  }

  /** Connect stars submitted within 2 hours (same batch). Thin, very low opacity. */
  function drawConstellationLines(w, h) {
    const sx = w / w0;
    const sy = h / h0;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i];
        const b = stars[j];
        if (Math.abs(a.ts - b.ts) > BATCH_MS) continue;
        const ax = a.x * sx;
        const ay = a.y * sy;
        const bx = b.x * sx;
        const by = b.y * sy;
        const dist = Math.hypot(bx - ax, by - ay);
        if (dist > 120 || dist < 20) continue;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }
  }

  function drawShootingStar(w, h, t) {
    if (!shootingStar) return;
    const { startX, startY, endX, endY, startT, duration, trailLength } = shootingStar;
    const elapsed = t - startT;
    const lingerMs = 400;
    if (elapsed > duration + lingerMs) {
      shootingStar = null;
      return;
    }
    const sx = w / w0;
    const sy = h / h0;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutExpo(progress);
    const headX = (startX + (endX - startX) * eased) * sx;
    const headY = (startY + (endY - startY) * eased) * sy;
    const angle = Math.atan2((endY - startY) * sy, (endX - startX) * sx);

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(angle);
    if (elapsed > duration) {
      const trailFade = 1 - (elapsed - duration) / lingerMs;
      ctx.globalAlpha = trailFade;
    }
    const trailGrad = ctx.createLinearGradient(-trailLength, 0, 0, 0);
    trailGrad.addColorStop(0, 'rgba(255,255,255,0)');
    trailGrad.addColorStop(0.3, 'rgba(255,220,180,0.12)');
    trailGrad.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    trailGrad.addColorStop(1, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = trailGrad;
    ctx.fillRect(-trailLength, -1.5, trailLength, 3);
    ctx.globalAlpha = 1;
    const headG = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
    headG.addColorStop(0, 'rgba(255,255,255,0.98)');
    headG.addColorStop(0.35, 'rgba(255,240,200,0.5)');
    headG.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function spawnShootingStar(w, h, t) {
    if (shootingStar) return;
    const side = Math.floor(Math.random() * 4);
    const pad = 0.05;
    let startX, startY, endX, endY;
    if (side === 0) {
      startX = Math.random() * w0;
      startY = -h0 * pad;
      endX = startX + (Math.random() - 0.5) * w0 * 0.6;
      endY = h0 * (1 + pad);
    } else if (side === 1) {
      startX = w0 * (1 + pad);
      startY = Math.random() * h0;
      endX = -w0 * pad;
      endY = startY + (Math.random() - 0.5) * h0 * 0.6;
    } else if (side === 2) {
      startX = Math.random() * w0;
      startY = h0 * (1 + pad);
      endX = startX + (Math.random() - 0.5) * w0 * 0.6;
      endY = -h0 * pad;
    } else {
      startX = -w0 * pad;
      startY = Math.random() * h0;
      endX = w0 * (1 + pad);
      endY = startY + (Math.random() - 0.5) * h0 * 0.6;
    }
    shootingStar = {
      startX, startY, endX, endY,
      startT: t,
      duration: SHOOTING_STAR_DURATION_MS,
      trailLength: 100,
    };
  }

  function drawStars(w, h, t) {
    const sx = w / w0;
    const sy = h / h0;
    const dimmed = selectedStarId !== null ? 0.45 : 1;

    stars.forEach((star) => {
      const px = star.x * sx;
      const py = star.y * sy;
      const tw = twinkle(star.phase, t);
      const isSelected = tapCeremony && tapCeremony.starId === star.id;
      const isDimmed = selectedStarId && selectedStarId !== star.id;

      let coreAlpha = tw * dimmed;
      let glowAlpha = 0.1 * dimmed;
      if (isSelected && tapCeremony) {
        const ceremonyProgress = Math.min(1, (t - tapCeremony.startTime) / 400);
        const pulse = 1 + 0.5 * Math.sin(ceremonyProgress * Math.PI);
        coreAlpha *= pulse;
        glowAlpha *= pulse;
      }
      if (isDimmed) {
        coreAlpha *= 0.4;
        glowAlpha *= 0.4;
      }

      const [r, g, b] = star.color;
      const glowR = (star.glowRadius / w0) * w;

      ctx.save();
      ctx.globalAlpha = glowAlpha;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},0.08)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const coreR = star.coreRadius; // 2–4px no photo, 4–6px with photo (CSS px)
      ctx.globalAlpha = coreAlpha;
      ctx.fillStyle = star.hasPhoto ? 'rgba(255,220,180,0.95)' : 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(px, py, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (tapCeremony && tapCeremony.starId === star.id) {
        const ringT = (t - tapCeremony.startTime) / 500;
        if (ringT < 1) {
          const ringR = easeOutExpo(ringT) * 50 * Math.min(sx, sy);
          const ringAlpha = 0.25 * (1 - ringT);
          ctx.strokeStyle = `rgba(255,255,255,${ringAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });
  }

  function countUpElapsed() {
    const nEl = wrap && wrap.querySelector('.constellation-n');
    if (!nEl) return;
    const target = contributors.length;
    let current = parseInt(nEl.textContent, 10) || 0;
    if (current < target) {
      nEl.textContent = current + 1;
      setTimeout(countUpElapsed, 120);
    } else {
      nEl.textContent = target;
    }
  }

  function render(t) {
    if (!running || !ctx) return;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.fillStyle = SKY_BG;
    ctx.fillRect(0, 0, w, h);

    drawNebula(w, h, t);
    drawAurora(w, h, t);
    drawConstellationLines(w, h);

    if (shootingStar) drawShootingStar(w, h, t);
    else if (t > nextShootingStarAt) {
      spawnShootingStar(w, h, t);
      nextShootingStarAt = t + SHOOTING_STAR_MIN_MS + Math.random() * (SHOOTING_STAR_MAX_MS - SHOOTING_STAR_MIN_MS);
    }

    drawStars(w, h, t);

    rafId = requestAnimationFrame(render);
  }

  /** Hit test: 44px minimum tap target (radius 22px in screen space) */
  function hitTest(clientX, clientY) {
    if (!cardEl) return null;
    const r = cardEl.getBoundingClientRect();
    const sx = r.width / w0;
    const sy = r.height / h0;
    const clickX = clientX - r.left;
    const clickY = clientY - r.top;
    let best = null;
    let bestD = Infinity;
    stars.forEach((star) => {
      const starScreenX = star.x * sx;
      const starScreenY = star.y * sy;
      const d = Math.hypot(clickX - starScreenX, clickY - starScreenY);
      if (d <= TAP_TARGET_RADIUS_PX && d < bestD) {
        bestD = d;
        best = star;
      }
    });
    return best;
  }

  function openModal(star) {
    const c = getContributor(star.id);
    if (!c) return;
    selectedStarId = star.id;
    tapCeremony = { starId: star.id, startTime: performance.now() };
    setTimeout(() => {
      const nameEl = modalEl.querySelector('.codex-constellation-modal-name');
      const msgEl = modalEl.querySelector('.codex-constellation-modal-msg');
      const photoEl = modalEl.querySelector('.codex-constellation-modal-photo');
      nameEl.textContent = c.name;
      msgEl.textContent = c.message;
      if (c.photoDataURL) {
        photoEl.style.backgroundImage = `url(${c.photoDataURL})`;
        photoEl.style.backgroundSize = 'cover';
        photoEl.style.backgroundPosition = 'center';
      } else {
        const [r, g, b] = hexToRgb(c.color || '#E8D4A8');
        photoEl.style.backgroundImage = '';
        photoEl.style.background = `linear-gradient(135deg,rgba(${r},${g},${b},.4),rgba(${r*0.8},${g*0.8},${b*0.8},.2))`;
      }
      const inner = modalEl.querySelector('.codex-constellation-modal-inner');
      if (inner) {
        inner.style.transform = 'scale(0.85)';
        inner.style.opacity = '0';
      }
      modalEl.style.display = 'flex';
      tapCeremony = null;
      if (inner) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            inner.style.transform = 'scale(1)';
            inner.style.opacity = '1';
          });
        });
      }
    }, 420);
  }

  function closeModal() {
    selectedStarId = null;
    const inner = modalEl && modalEl.querySelector('.codex-constellation-modal-inner');
    if (inner) {
      inner.style.transform = 'scale(0.85)';
      inner.style.opacity = '0';
      setTimeout(() => {
        if (modalEl) modalEl.style.display = 'none';
        inner.style.transform = 'scale(0.85)';
        inner.style.opacity = '0';
      }, 300);
    } else {
      if (modalEl) modalEl.style.display = 'none';
    }
  }

  function onPointerDown(e) {
    const x = e.clientX != null ? e.clientX : (e.touches && e.touches[0].clientX);
    const y = e.clientY != null ? e.clientY : (e.touches && e.touches[0].clientY);
    const star = hitTest(x, y);
    if (star) openModal(star);
  }

  function downloadConstellationAsImage() {
    if (!canvas || !ctx) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `constellation-${cardId || 'card'}-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.warn('Constellation export failed:', err);
    }
  }

  function init() {
    if (!container) return;
    if (wrap && container.contains(wrap)) return;
    createDOM();
    container.appendChild(wrap);
    resize();
    window.addEventListener('resize', resize);

    loadContributors();
    initStars();
    initNebula();
    nextShootingStarAt = performance.now() + 3000 + Math.random() * 5000;

    const closeBtn = wrap.querySelector('.codex-constellation-close');
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const innerModal = wrap.querySelector('.codex-constellation-modal-inner');
    if (innerModal) innerModal.addEventListener('click', (e) => e.stopPropagation());

    canvas.addEventListener('click', onPointerDown);
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches && e.changedTouches[0];
      if (t) onPointerDown({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: false });

    const onMouseMove = (e) => {
      const r = cardEl.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width;
      mouseY = (e.clientY - r.top) / r.height;
      parallaxX = (mouseX - 0.5) * 2;
      parallaxY = (mouseY - 0.5) * 2;
    };
    cardEl.addEventListener('mousemove', onMouseMove);
    wrap._parallaxCleanup = () => cardEl.removeEventListener('mousemove', onMouseMove);

    setTimeout(countUpElapsed, 600);

    running = true;
    rafId = requestAnimationFrame(render);

    if (typeof onReady === 'function') {
      onReady({ downloadConstellationAsImage });
    }
  }

  function destroy() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener('resize', resize);
    if (wrap && wrap._parallaxCleanup) wrap._parallaxCleanup();
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    wrap = null;
    cardEl = null;
    canvas = null;
    ctx = null;
  }

  return { init, destroy, downloadConstellationAsImage };
}

/**
 * Inline demo for Codex tab: uses demo storage key / sample data, no cardId.
 */
export function createConstellationDemo(container) {
  return createConstellationCard({
    container,
    cardId: 'demo',
    fullPage: false,
  });
}
