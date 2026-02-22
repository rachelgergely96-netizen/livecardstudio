/**
 * Constellation Group Cards — "Every person becomes a star in your sky"
 * Living art: nebula, organic twinkle, faint constellation lines,
 * shooting star, aurora, tap-to-reveal ceremony.
 */

const EASE = 'cubic-bezier(.23, 1, .32, 1)';

// Hand-picked night sky — deep purples and midnight blues, infinite
const NEBULA_LAYERS = [
  { r: 180, driftX: 0.02, driftY: 0.01, color: '40,25,80', alpha: 0.09, ph: 0 },
  { r: 220, driftX: -0.015, driftY: 0.018, color: '20,15,50', alpha: 0.07, ph: 2 },
  { r: 160, driftX: 0.01, driftY: -0.012, color: '55,30,95', alpha: 0.06, ph: 4 },
  { r: 200, driftX: -0.018, driftY: -0.008, color: '28,22,58', alpha: 0.08, ph: 1 },
  { r: 140, driftX: 0.012, driftY: 0.022, color: '35,20,65', alpha: 0.05, ph: 3 },
];

// Aurora — gossamer, barely perceptible
const AURORA_COLORS = [
  { r: 80, g: 120, b: 100, a: 0.04 },
  { r: 100, g: 80, b: 130, a: 0.035 },
  { r: 60, g: 100, b: 110, a: 0.03 },
];

// Sample contributors for the demo sky (no two stars alike)
const SAMPLE_CONTRIBUTORS = [
  { id: '1', name: 'Maya', message: 'You light up every room.', color: [255, 220, 180], hasPhoto: true, ts: 0 },
  { id: '2', name: 'James', message: 'So proud of you.', color: [180, 200, 255], hasPhoto: false, ts: 0 },
  { id: '3', name: 'Sophie', message: 'Forever in our hearts.', color: [255, 200, 220], hasPhoto: true, ts: 1000 },
  { id: '4', name: 'Leo', message: 'To the stars and back.', color: [200, 255, 220], hasPhoto: false, ts: 1000 },
  { id: '5', name: 'Elena', message: 'With love always.', color: [255, 230, 200], hasPhoto: false, ts: 7200000 },
  { id: '6', name: 'Alex', message: 'Shine on.', color: [220, 200, 255], hasPhoto: true, ts: 7200000 },
  { id: '7', name: 'Jordan', message: 'So grateful for you.', color: [200, 230, 255], hasPhoto: false, ts: 7200000 },
  { id: '8', name: 'Riley', message: 'You are the best.', color: [255, 245, 220], hasPhoto: false, ts: 0 },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Irregular twinkle: occasional bright flickers, long quiet periods.
 * Returns multiplier 0.4–1.0.
 */
function organicTwinkle(star, t) {
  const { phase, twinkleType, twinkleSpeed } = star;
  const T = t * 0.001 + phase;
  if (twinkleType === 'steady') {
    return 0.7 + 0.15 * Math.sin(T * 0.7);
  }
  if (twinkleType === 'pulse') {
    return 0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(T * twinkleSpeed)), 2);
  }
  // Flicker: most of the time base, sometimes a brief bright spike
  const spike = Math.sin(T * 12.7) * Math.sin(T * 3.1);
  if (spike > 0.92) {
    const decay = (spike - 0.92) / 0.08;
    return lerp(0.6, 1, Math.exp(-decay * 8));
  }
  return 0.5 + 0.15 * Math.sin(T * 0.5);
}

export function createConstellationDemo(container) {
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
  let tapCeremony = null; // { starId, startTime, ringRadius }
  const w0 = 400;
  const h0 = 560;
  const SKY_BG = '#0A0A14';

  function createDOM() {
    wrap = document.createElement('div');
    wrap.className = 'codex-demo-wrap codex-constellation-wrap';
    wrap.innerHTML = `
      <div class="codex-demo-card codex-constellation-card" style="aspect-ratio:5/7;max-width:300px;width:100%;position:relative;border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.35);">
        <canvas class="codex-constellation-canvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;cursor:pointer;"></canvas>
        <div class="codex-constellation-header" style="position:absolute;top:0;left:0;right:0;z-index:2;text-align:center;padding:14px 12px;pointer-events:none;">
          <div class="codex-constellation-title" style="font-family:'Cormorant Garamond',serif;font-size:.75rem;font-weight:300;letter-spacing:.2em;color:rgba(255,255,255,.7);">A constellation for you</div>
          <div class="codex-constellation-count" style="font-family:'DM Sans',sans-serif;font-size:.5rem;letter-spacing:.15em;color:rgba(255,255,255,.35);margin-top:4px;"><span class="constellation-n">0</span> stars shining for you</div>
        </div>
        <div class="codex-constellation-modal" style="display:none;position:absolute;inset:0;z-index:10;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
          <div class="codex-constellation-modal-inner" style="background:rgba(20,18,35,.95);border-radius:20px;padding:28px;max-width:260px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5);">
            <div class="codex-constellation-modal-photo" style="width:72px;height:72px;border-radius:50%;margin:0 auto 14px;background:linear-gradient(135deg,rgba(201,169,110,.2),rgba(140,100,160,.2));overflow:hidden;"></div>
            <div class="codex-constellation-modal-name" style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:400;color:rgba(255,255,255,.95);margin-bottom:6px;"></div>
            <p class="codex-constellation-modal-msg" style="font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:300;color:rgba(255,255,255,.6);line-height:1.6;margin-bottom:18px;"></p>
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

  function loadContributors() {
    try {
      const raw = localStorage.getItem('livecard_constellation_demo');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) contributors = parsed;
        else contributors = [...SAMPLE_CONTRIBUTORS];
      } else {
        contributors = [...SAMPLE_CONTRIBUTORS];
      }
    } catch {
      contributors = [...SAMPLE_CONTRIBUTORS];
    }
  }

  function initStars() {
    const margin = 0.1;
    const cols = Math.ceil(Math.sqrt(contributors.length));
    const rows = Math.ceil(contributors.length / cols);
    const cellW = w0 * (1 - 2 * margin) / cols;
    const cellH = h0 * (1 - 2 * margin) / rows;
    stars = contributors.map((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (Math.random() - 0.5) * 28;
      const offsetY = (Math.random() - 0.5) * 28;
      const x = w0 * margin + cellW * (col + 0.5) + offsetX;
      const y = h0 * margin + cellH * (row + 0.5) + offsetY;
      const twinkleTypes = ['steady', 'pulse', 'flicker'];
      return {
        id: c.id,
        x, y,
        color: c.color,
        hasPhoto: c.hasPhoto,
        baseRadius: (c.hasPhoto ? 3.5 : 2.2) + Math.random() * 1.2,
        glowRadius: 14 + Math.random() * 12,
        phase: Math.random() * 6.28,
        twinkleType: twinkleTypes[Math.floor(Math.random() * twinkleTypes.length)],
        twinkleSpeed: 0.4 + Math.random() * 0.8,
        ts: c.ts || 0,
      };
    });
  }

  function initNebula() {
    nebulaBlobs = NEBULA_LAYERS.map((layer, i) => ({
      ...layer,
      x: w0 * (0.3 + 0.4 * Math.random()),
      y: h0 * (0.2 + 0.6 * Math.random()),
    }));
  }

  function getContributor(id) {
    return contributors.find(c => c.id === id) || null;
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
    nebulaBlobs.forEach(b => {
      b.x += b.driftX + 0.008 * Math.sin(t * 0.0003 + b.ph);
      b.y += b.driftY + 0.006 * Math.cos(t * 0.00025 + b.ph);
      if (b.x < -b.r) b.x = w + b.r;
      if (b.x > w + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = h + b.r;
      if (b.y > h + b.r) b.y = -b.r;
      const scale = w / w0;
      const r = b.r * scale * (0.95 + 0.1 * Math.sin(t * 0.0004 + b.ph));
      const alpha = b.alpha * (0.7 + 0.3 * Math.sin(t * 0.0005 + b.ph));
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      g.addColorStop(0, `rgba(${b.color},${alpha})`);
      g.addColorStop(0.6, `rgba(${b.color},${alpha * 0.3})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function drawAurora(w, h, t) {
    const bandHeight = h * 0.18;
    AURORA_COLORS.forEach((ac, i) => {
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

  function drawConstellationLines(w, h, t) {
    const sx = w / w0, sy = h / h0;
    // Connect stars within same "batch" (similar ts) — very faint
    const batchThreshold = 2 * 3600000;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i], b = stars[j];
        if (Math.abs(a.ts - b.ts) > batchThreshold) continue;
        const dx = (b.x - a.x) * sx, dy = (b.y - a.y) * sy;
        const dist = Math.hypot(dx, dy);
        if (dist > 80 || dist < 25) continue;
        ctx.beginPath();
        ctx.moveTo(a.x * sx, a.y * sy);
        ctx.lineTo(b.x * sx, b.y * sy);
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
    const sx = w / w0, sy = h / h0;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutExpo(progress);
    const headX = (startX + (endX - startX) * eased) * sx;
    const headY = (startY + (endY - startY) * eased) * sy;
    const angle = Math.atan2((endY - startY) * sy, (endX - startX) * sx);

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(angle);

    // Lingering trail (fade after head passes)
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

    // Head — bright white, small
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
    const W = w0, H = h0;
    if (side === 0) {
      startX = Math.random() * W; startY = -H * pad;
      endX = startX + (Math.random() - 0.5) * W * 0.6;
      endY = H * (1 + pad);
    } else if (side === 1) {
      startX = W * (1 + pad); startY = Math.random() * H;
      endX = -W * pad; endY = startY + (Math.random() - 0.5) * H * 0.6;
    } else if (side === 2) {
      startX = Math.random() * W; startY = H * (1 + pad);
      endX = startX + (Math.random() - 0.5) * W * 0.6;
      endY = -H * pad;
    } else {
      startX = -W * pad; startY = Math.random() * H;
      endX = W * (1 + pad); endY = startY + (Math.random() - 0.5) * H * 0.6;
    }
    shootingStar = {
      startX, startY, endX, endY,
      startT: t, duration: 850, trailLength: 100,
    };
  }

  function drawStars(w, h, t) {
    const sx = w / w0, sy = h / h0;
    const dimmed = selectedStarId !== null ? 0.45 : 1;

    stars.forEach(star => {
      const px = star.x * sx, py = star.y * sy;
      const tw = organicTwinkle(star, t);
      const isSelected = tapCeremony && tapCeremony.starId === star.id;
      const isDimmed = selectedStarId && selectedStarId !== star.id;

      let coreAlpha = tw * dimmed;
      let glowAlpha = (0.08 + tw * 0.06) * dimmed;
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
      const glowR = star.glowRadius * sx;

      ctx.save();
      ctx.globalAlpha = glowAlpha;
      const g = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      g.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
      g.addColorStop(0.5, `rgba(${r},${g},${b},0.08)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const coreR = (star.hasPhoto ? 1.2 : 0.8) * star.baseRadius * sx;
      ctx.globalAlpha = coreAlpha;
      ctx.fillStyle = star.hasPhoto ? `rgba(255,220,180,0.95)` : `rgba(255,255,255,0.9)`;
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
    const current = parseInt(nEl.textContent, 10) || 0;
    if (current < target) {
      nEl.textContent = current + 1;
      requestAnimationFrame(() => setTimeout(countUpElapsed, 120));
    } else {
      nEl.textContent = target;
    }
  }

  function render(t) {
    if (!running || !ctx) return;
    const w = canvas.width / dpr, h = canvas.height / dpr;

    ctx.fillStyle = SKY_BG;
    ctx.fillRect(0, 0, w, h);

    drawNebula(w, h, t);
    drawAurora(w, h, t);
    drawConstellationLines(w, h, t);

    if (shootingStar) drawShootingStar(w, h, t);
    else if (t > nextShootingStarAt) {
      spawnShootingStar(w, h, t);
      nextShootingStarAt = t + 8000 + Math.random() * 7000;
    }

    drawStars(w, h, t);

    rafId = requestAnimationFrame(render);
  }

  function hitTest(x, y) {
    const r = cardEl.getBoundingClientRect();
    const scaleX = w0 / r.width, scaleY = h0 / r.height;
    const px = (x - r.left) * scaleX, py = (y - r.top) * scaleY;
    const minDist = 28;
    let best = null, bestD = Infinity;
    stars.forEach(star => {
      const d = Math.hypot(star.x - px, star.y - py);
      if (d < minDist && d < bestD) {
        bestD = d; best = star;
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
      const inner = modalEl.querySelector('.codex-constellation-modal-inner');
      const nameEl = modalEl.querySelector('.codex-constellation-modal-name');
      const msgEl = modalEl.querySelector('.codex-constellation-modal-msg');
      const photoEl = modalEl.querySelector('.codex-constellation-modal-photo');
      nameEl.textContent = c.name;
      msgEl.textContent = c.message;
      photoEl.style.background = c.color ? `linear-gradient(135deg,rgba(${c.color[0]},${c.color[1]},${c.color[2]},.4),rgba(${c.color[0]*.8},${c.color[1]*.8},${c.color[2]*.8},.2))` : 'linear-gradient(135deg,rgba(201,169,110,.2),rgba(140,100,160,.2))';
      modalEl.style.display = 'flex';
      tapCeremony = null;
    }, 420);
  }

  function closeModal() {
    modalEl.style.display = 'none';
    selectedStarId = null;
  }

  function onPointerDown(e) {
    const x = e.clientX != null ? e.clientX : (e.touches && e.touches[0].clientX);
    const y = e.clientY != null ? e.clientY : (e.touches && e.touches[0].clientY);
    const star = hitTest(x, y);
    if (star) openModal(star);
  }

  function init() {
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
    modalEl.addEventListener('click', e => { if (e.target === modalEl) closeModal(); });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    innerModal = wrap.querySelector('.codex-constellation-modal-inner');
    if (innerModal) innerModal.addEventListener('click', e => e.stopPropagation());

    canvas.addEventListener('click', onPointerDown);
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t) onPointerDown({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: false });

    setTimeout(countUpElapsed, 600);

    running = true;
    rafId = requestAnimationFrame(render);
  }

  let innerModal;
  function destroy() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener('resize', resize);
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    wrap = null;
    canvas = null;
    ctx = null;
  }

  return { init, destroy };
}
