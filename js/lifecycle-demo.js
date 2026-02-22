/**
 * Time-Evolving Lifecycle — LiveCard Studio
 * Client-side date math: card.createdAt → stage config (palette, particles, message).
 * Export: getLifecycleState(createdAt), getTimeOfDayModifier(), createLifecycleDemo().
 */

const MS_PER_DAY = 86400000;

export const LIFECYCLE_STAGES = ['SEED', 'SPROUT', 'BUD', 'BLOOM', 'FULL_GARDEN', 'GOLDEN_FADE'];

const STAGE_CONFIG = [
  {
    name: 'SEED',
    minDay: 0,
    maxDay: 1,
    bg: '#1a1510',
    blobs: [{ c: '40,35,25', a: 0.04 }, { c: '50,40,30', a: 0.03 }],
    particleCountMin: 5,
    particleCountMax: 8,
    bloomPercent: 0,
    message: 'Something beautiful is growing...',
    speedMultiplier: 1,
    hasStems: false,
    hasBuds: false,
    hasFlowers: false,
    hasButterflies: false,
    hasSparkles: false,
    flowerCount: 0,
  },
  {
    name: 'SPROUT',
    minDay: 2,
    maxDay: 4,
    bg: '#1e1a12',
    blobs: [{ c: '55,48,35', a: 0.05 }, { c: '45,65,40', a: 0.04 }, { c: '50,55,38', a: 0.03 }],
    particleCountMin: 10,
    particleCountMax: 15,
    bloomPercent: 0,
    message: 'Watch it bloom...',
    speedMultiplier: 1,
    hasStems: true,
    hasBuds: false,
    hasFlowers: false,
    hasButterflies: false,
    hasSparkles: false,
    flowerCount: 0,
  },
  {
    name: 'BUD',
    minDay: 5,
    maxDay: 9,
    bg: '#252015',
    blobs: [{ c: '70,55,35', a: 0.06 }, { c: '55,70,45', a: 0.05 }, { c: '90,75,45', a: 0.04 }],
    particleCountMin: 20,
    particleCountMax: 25,
    bloomPercent: 0.3,
    message: 'Almost ready...',
    speedMultiplier: 1,
    hasStems: true,
    hasBuds: true,
    hasFlowers: false,
    hasButterflies: false,
    hasSparkles: false,
    flowerCount: 3,
  },
  {
    name: 'BLOOM',
    minDay: 10,
    maxDay: 19,
    bg: '#2a2218',
    blobs: [{ c: '100,75,50', a: 0.08 }, { c: '90,85,55', a: 0.07 }, { c: '120,90,60', a: 0.06 }, { c: '95,70,65', a: 0.05 }],
    particleCountMin: 35,
    particleCountMax: 40,
    bloomPercent: 1,
    message: null,
    speedMultiplier: 1,
    hasStems: true,
    hasBuds: false,
    hasFlowers: true,
    hasButterflies: false,
    hasSparkles: false,
    flowerCount: 7,
  },
  {
    name: 'FULL_GARDEN',
    minDay: 20,
    maxDay: 34,
    bg: '#2c251a',
    blobs: [{ c: '105,80,52', a: 0.09 }, { c: '95,88,58', a: 0.08 }, { c: '125,95,62', a: 0.07 }, { c: '100,75,68', a: 0.06 }],
    particleCountMin: 45,
    particleCountMax: 50,
    bloomPercent: 1,
    message: null,
    speedMultiplier: 1,
    hasStems: true,
    hasBuds: false,
    hasFlowers: true,
    hasButterflies: true,
    hasSparkles: true,
    flowerCount: 10,
  },
  {
    name: 'GOLDEN_FADE',
    minDay: 35,
    maxDay: Infinity,
    bg: '#2a2218',
    blobs: [{ c: '140,110,70', a: 0.07 }, { c: '130,100,65', a: 0.06 }, { c: '150,115,75', a: 0.05 }],
    particleCountMin: 40,
    particleCountMax: 45,
    bloomPercent: 0.7,
    message: 'A memory preserved in gold',
    speedMultiplier: 0.6,
    hasStems: true,
    hasBuds: false,
    hasFlowers: true,
    hasButterflies: false,
    hasSparkles: false,
    flowerCount: 6,
  },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function parseBlobC(c) {
  const parts = (c || '').split(',').map(Number);
  return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0 };
}

function lerpBlob(a, b, t) {
  const pa = parseBlobC(a.c);
  const pb = parseBlobC(b.c);
  const r = Math.round(lerp(pa.r, pb.r, t));
  const g = Math.round(lerp(pa.g, pb.g, t));
  const b = Math.round(lerp(pa.b, pb.b, t));
  return {
    c: `${r},${g},${b}`,
    a: lerp(typeof a.a === 'number' ? a.a : 0.05, typeof b.a === 'number' ? b.a : 0.05, t),
  };
}

/**
 * Time-of-day modifier. Call with new Date().getHours().
 * Morning 6-10: warmer golden, +10% brightness
 * Midday 10-16: neutral
 * Evening 16-20: amber tint, softer
 * Night 20-6: cooler, bioluminescent, reduce flower visibility
 */
export function getTimeOfDayModifier(hours) {
  if (hours >= 6 && hours < 10) {
    return { warmth: 1.1, brightness: 1.1, amber: 0.2, cool: 0, bioluminescent: false, flowerVisibility: 1 };
  }
  if (hours >= 10 && hours < 16) {
    return { warmth: 1, brightness: 1, amber: 0, cool: 0, bioluminescent: false, flowerVisibility: 1 };
  }
  if (hours >= 16 && hours < 20) {
    return { warmth: 1.05, brightness: 0.95, amber: 0.35, cool: 0, bioluminescent: false, flowerVisibility: 1 };
  }
  return { warmth: 0.85, brightness: 0.6, cool: 0.25, amber: 0, bioluminescent: true, flowerVisibility: 0.5 };
}

/**
 * Get lifecycle stage config from card creation timestamp.
 * @param {string|Date|number} createdAt - ISO timestamp or Date
 * @param {{ overrideStage?: string, customMessage?: string }} options - overrideStage for demo/preview; customMessage for BLOOM/FULL_GARDEN
 * @returns {{
 *   name: string,
 *   particleCount: number,
 *   palette: { bg: string, blobs: Array<{c:string,a:number}> },
 *   bloomPercent: number,
 *   message: string | null,
 *   speedMultiplier: number,
 *   daysSinceCreation: number,
 *   transitionLerp: number,
 *   nextStage: object | null,
 *   timeOfDay: object,
 *   hasStems: boolean,
 *   hasBuds: boolean,
 *   hasFlowers: boolean,
 *   hasButterflies: boolean,
 *   hasSparkles: boolean,
 *   flowerCount: number
 * }}
 */
export function getLifecycleState(createdAt, options = {}) {
  const overrideStage = options.overrideStage;
  const customMessage = options.customMessage;
  const now = Date.now();
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const daysSinceCreation = Math.floor((now - created) / MS_PER_DAY);
  const hours = new Date().getHours();
  const timeOfDay = getTimeOfDayModifier(hours);

  let stageIndex = 0;
  let transitionLerp = 0;
  let nextStage = null;

  if (overrideStage) {
    const idx = LIFECYCLE_STAGES.indexOf(overrideStage);
    stageIndex = idx >= 0 ? idx : 0;
  } else {
    for (let i = 0; i < STAGE_CONFIG.length; i++) {
      const s = STAGE_CONFIG[i];
      if (daysSinceCreation >= s.minDay && daysSinceCreation <= s.maxDay) {
        stageIndex = i;
        const next = STAGE_CONFIG[i + 1];
        const boundary = s.maxDay;
        if (next && boundary !== Infinity && daysSinceCreation >= boundary - 1) {
          transitionLerp = Math.min(1, (daysSinceCreation - (boundary - 1)) / 1);
          nextStage = next;
        }
        break;
      }
      if (daysSinceCreation < s.minDay) break;
      stageIndex = i;
    }
  }

  const curr = STAGE_CONFIG[stageIndex];
  const next = nextStage || curr;

  const t = transitionLerp;
  const currCount = (curr.particleCountMin + curr.particleCountMax) / 2;
  const nextCount = (next.particleCountMin + next.particleCountMax) / 2;
  const particleCount = Math.round(lerp(currCount, nextCount, t));
  const bloomPercent = lerp(curr.bloomPercent, next.bloomPercent, t);
  const speedMultiplier = lerp(curr.speedMultiplier, next.speedMultiplier, t);
  let message = t < 0.5 ? curr.message : next.message;
  if ((curr.name === 'BLOOM' || curr.name === 'FULL_GARDEN') && customMessage) message = customMessage;
  if (next.name === 'BLOOM' || next.name === 'FULL_GARDEN') {
    if (t >= 0.5 && customMessage) message = customMessage;
  }

  const palette = {
    bg: curr.bg,
    blobs: curr.blobs.map((b, i) => lerpBlob(b, next.blobs[i] || b, t)),
  };

  const flowerVisibility = timeOfDay.flowerVisibility;

  return {
    name: curr.name,
    particleCount,
    palette,
    bloomPercent,
    message,
    speedMultiplier,
    daysSinceCreation,
    transitionLerp,
    nextStage: nextStage ? { name: next.name } : null,
    timeOfDay,
    hasStems: curr.hasStems,
    hasBuds: curr.hasBuds,
    hasFlowers: curr.hasFlowers,
    hasButterflies: curr.hasButterflies,
    hasSparkles: curr.hasSparkles,
    flowerCount: Math.round(lerp(curr.flowerCount, next.flowerCount || curr.flowerCount, t)),
    flowerVisibility,
  };
}

// ——— Demo ———
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const w0 = 400;
const h0 = 560;

export function createLifecycleDemo(container) {
  let wrap = null;
  let cardEl = null;
  let canvas = null;
  let ctx = null;
  let rafId = null;
  let running = false;
  let overrideStage = null;
  let particles = [];
  let blobs = [];
  let stems = [];
  let flowers = [];
  let butterflies = [];
  let sparkles = [];
  let bioDots = [];

  function createDOM() {
    wrap = document.createElement('div');
    wrap.className = 'codex-demo-wrap codex-lifecycle-wrap';
    wrap.innerHTML = `
      <div class="codex-demo-card codex-lifecycle-card" style="aspect-ratio:5/7;max-width:300px;width:100%;position:relative;border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.08);">
        <canvas class="codex-lifecycle-canvas" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
        <div class="codex-lifecycle-message" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:4;text-align:center;padding:16px;pointer-events:none;font-family:'Cormorant Garamond',serif;font-size:clamp(0.75rem,2.5vw,0.95rem);color:rgba(255,255,255,.92);text-shadow:0 1px 3px rgba(0,0,0,.4);max-width:85%;"></div>
        <div class="codex-lifecycle-ui" style="position:absolute;bottom:0;left:0;right:0;z-index:5;padding:12px 14px;background:linear-gradient(transparent,rgba(0,0,0,.4));color:#fff;">
          <div class="codex-lifecycle-stage" style="font-family:'Cormorant Garamond',serif;font-size:.8rem;font-weight:500;"></div>
          <div class="codex-lifecycle-day" style="font-size:.52rem;opacity:.9;margin-top:2px;"></div>
          <div class="codex-lifecycle-pills" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;justify-content:center;">
            <button type="button" data-stage="SEED" class="codex-lifecycle-pill" style="padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:rgba(255,255,255,.9);font-size:.5rem;cursor:pointer;">Seed</button>
            <button type="button" data-stage="SPROUT" class="codex-lifecycle-pill" style="padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:rgba(255,255,255,.9);font-size:.5rem;cursor:pointer;">Sprout</button>
            <button type="button" data-stage="BUD" class="codex-lifecycle-pill" style="padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:rgba(255,255,255,.9);font-size:.5rem;cursor:pointer;">Bud</button>
            <button type="button" data-stage="BLOOM" class="codex-lifecycle-pill" style="padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:rgba(255,255,255,.9);font-size:.5rem;cursor:pointer;">Bloom</button>
            <button type="button" data-stage="FULL_GARDEN" class="codex-lifecycle-pill" style="padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:rgba(255,255,255,.9);font-size:.5rem;cursor:pointer;">Garden</button>
            <button type="button" data-stage="GOLDEN_FADE" class="codex-lifecycle-pill" style="padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:rgba(255,255,255,.9);font-size:.5rem;cursor:pointer;">Golden</button>
          </div>
        </div>
      </div>
    `;
    cardEl = wrap.querySelector('.codex-lifecycle-card');
    canvas = wrap.querySelector('.codex-lifecycle-canvas');
    const pills = wrap.querySelectorAll('.codex-lifecycle-pill');
    pills.forEach(btn => {
      btn.addEventListener('click', () => {
        overrideStage = btn.dataset.stage;
        pills.forEach(b => b.style.background = 'rgba(255,255,255,.08)');
        btn.style.background = 'rgba(201,169,110,.35)';
        btn.style.borderColor = 'rgba(201,169,110,.6)';
        rebuildFromState();
      });
    });
    return wrap;
  }

  function getCreatedAt() {
    const hash = (window.location.hash || '').slice(1);
    const m = hash && /createdAt=(\d+)/i.test(hash) && hash.match(/createdAt=(\d+)/);
    if (m) return new Date(parseInt(m[1], 10));
    try {
      const s = localStorage.getItem('livecard_demo_createdAt');
      if (s) return new Date(parseInt(s, 10));
    } catch (_) {}
    return new Date(Date.now() - 10 * MS_PER_DAY);
  }

  function getState() {
    return getLifecycleState(getCreatedAt(), { overrideStage: overrideStage || undefined, customMessage: 'Your message here' });
  }

  function rebuildFromState() {
    const state = getState();
    const { palette, particleCount, name, hasStems, hasBuds, hasFlowers, flowerCount, hasButterflies, hasSparkles, speedMultiplier } = state;
    const spd = speedMultiplier;

    particles = [];
    blobs = palette.blobs.map((b, i) => ({
      x: w0 * (0.2 + 0.6 * (i / (palette.blobs.length + 1))),
      y: h0 * (0.3 + 0.5 * Math.random()),
      r: 80 + Math.random() * 100,
      c: b.c,
      a: b.a,
      ph: Math.random() * 6.28,
    }));

    const n = Math.min(particleCount, 50);
    if (name === 'SEED') {
      for (let i = 0; i < n; i++) {
        particles.push({ type: 'seed', x: w0 * (0.15 + 0.7 * Math.random()), y: h0 * (0.4 + 0.5 * Math.random()), size: 0.8 + Math.random() * 1.2, ph: Math.random() * 6.28 });
      }
    } else if (name === 'SPROUT') {
      for (let i = 0; i < n; i++) {
        particles.push({ type: 'dust', x: w0 * Math.random(), y: h0 * (0.3 + 0.6 * Math.random()), size: 1.2 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 0.08, vy: -0.02 - Math.random() * 0.04, ph: Math.random() * 6.28 });
      }
    } else if (name === 'BUD') {
      for (let i = 0; i < n; i++) {
        const isCircle = Math.random() > 0.5;
        particles.push({
          type: isCircle ? 'circle' : 'petal',
          x: w0 * (0.1 + 0.8 * Math.random()),
          y: h0 * (0.2 + 0.7 * Math.random()),
          size: 1.5 + Math.random() * 3,
          ph: Math.random() * 6.28,
          drift: 0.0002 * spd,
        });
      }
    } else {
      for (let i = 0; i < n; i++) {
        const rising = Math.random() > 0.5;
        particles.push({
          type: 'petal',
          x: w0 * (0.05 + 0.9 * Math.random()),
          y: rising ? h0 * (0.5 + 0.5 * Math.random()) : -10 - Math.random() * 80,
          size: 2 + Math.random() * 5,
          ph: Math.random() * 6.28,
          drift: (0.0003 + Math.random() * 0.0006) * spd,
          vy: rising ? -0.03 - Math.random() * 0.06 : 0.04 + Math.random() * 0.1,
          vx: (Math.random() - 0.5) * 0.06,
          hue: 10 + Math.random() * 50,
        });
      }
    }

    stems = [];
    if (hasStems) {
      const numStems = name === 'SPROUT' ? 8 : 12;
      for (let i = 0; i < numStems; i++) {
        stems.push({
          x: w0 * (0.15 + 0.7 * Math.random()),
          y: h0 * (0.5 + 0.4 * Math.random()),
          h: 25 + Math.random() * 50,
          ph: Math.random() * 6.28,
        });
      }
    }

    flowers = [];
    if (hasBuds || hasFlowers) {
      const count = hasBuds ? 4 : flowerCount;
      for (let i = 0; i < count; i++) {
        flowers.push({
          x: w0 * (0.15 + 0.7 * Math.random()),
          y: h0 * (0.25 + 0.55 * Math.random()),
          petals: 5 + (i % 3),
          open: hasBuds ? 0.2 + Math.random() * 0.3 : 0.85 + Math.random() * 0.15,
          size: 8 + Math.random() * 14,
          ph: Math.random() * 6.28,
          hue: 15 + Math.random() * 40,
        });
      }
    }

    butterflies = [];
    if (hasButterflies) {
      for (let i = 0; i < 4; i++) {
        butterflies.push({
          x: w0 * Math.random(),
          y: h0 * (0.2 + 0.6 * Math.random()),
          t0: Math.random() * 6.28,
          speed: 0.002 + Math.random() * 0.002,
          scale: 2 + Math.random() * 2,
        });
      }
    }

    sparkles = [];
    bioDots = [];
  }

  function resize() {
    if (!cardEl || !canvas) return;
    const r = cardEl.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render(t) {
    if (!running || !ctx) return;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const sx = w / w0;
    const sy = h / h0;
    const state = getState();
    const { palette, message, name, daysSinceCreation, speedMultiplier: spd, timeOfDay, hasSparkles, flowerVisibility } = state;

    const { brightness, warmth, cool, bioluminescent } = timeOfDay;

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);

    for (const b of blobs) {
      const bx = b.x * sx + Math.sin(t * 0.0004 * spd + b.ph) * 12;
      const by = b.y * sy + Math.cos(t * 0.0003 * spd + b.ph) * 10;
      const a = b.a * (0.6 + 0.4 * Math.sin(t * 0.001 + b.ph)) * brightness;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
      g.addColorStop(0, `rgba(${b.c},${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.save();
    ctx.scale(sx, sy);

    for (const s of stems) {
      const sway = Math.sin(t * 0.0008 * spd + s.ph) * 4;
      ctx.strokeStyle = `rgba(70,100,60,${0.35 * brightness})`;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(s.x + sway + 5, s.y - s.h * 0.5, s.x + sway, s.y - s.h);
      ctx.stroke();
    }

    for (const f of flowers) {
      const breath = 0.9 + 0.1 * Math.sin(t * 0.002 + f.ph);
      const open = f.open * breath * flowerVisibility;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.globalAlpha = flowerVisibility;
      for (let i = 0; i < f.petals; i++) {
        ctx.save();
        ctx.rotate((i / f.petals) * Math.PI * 2 + f.ph * 0.1);
        const pl = f.size * open;
        const pw = f.size * 0.25;
        ctx.fillStyle = open > 0.5 ? `hsla(${f.hue},40%,72%,0.7)` : `rgba(160,130,90,0.6)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(pw, -pl * 0.4, pw * 0.8, -pl * 0.9, 0, -pl);
        ctx.bezierCurveTo(-pw * 0.8, -pl * 0.9, -pw, -pl * 0.4, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    for (const p of particles) {
      if (p.type === 'seed') {
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.002 * spd + p.ph);
        ctx.fillStyle = `rgba(100,80,55,${0.5 * pulse * brightness})`;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        p.x += (p.vx || 0) * spd;
        p.y += (p.vy || 0) * spd;
        if (p.y < -5) p.y = h0 + 5;
        ctx.globalAlpha = (0.4 + 0.3 * Math.sin(t * 0.001 + p.ph)) * brightness;
        ctx.fillStyle = 'rgba(180,170,140,0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'circle') {
        const r = p.size * (0.7 + 0.3 * Math.sin(t * 0.001 * spd + p.ph));
        ctx.fillStyle = `rgba(200,180,140,${0.4 * brightness})`;
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(t * p.drift + p.ph) * 3, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        p.x += (p.vx || 0) * spd + Math.sin(t * (p.drift || 0.001) + p.ph) * 0.5;
        p.y += (p.vy || 0) * spd;
        if (p.y > h0 + 15) p.y = -15;
        if (p.y < -15) p.y = h0 + 15;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ph * 0.2 + t * 0.0003);
        ctx.globalAlpha = (0.5 + 0.2 * Math.sin(t * 0.001 + p.ph)) * flowerVisibility * brightness;
        const s = p.size;
        const pw = s * 0.35;
        ctx.fillStyle = `hsla(${p.hue || 25},38%,72%,0.6)`;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(pw, -s * 0.5, pw * 0.8, s * 0.3, 0, s);
        ctx.bezierCurveTo(-pw * 0.6, s * 0.4, -pw * 0.9, -s * 0.3, 0, -s);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    if (hasSparkles && Math.random() < 0.08) {
      sparkles.push({ x: Math.random() * w0, y: Math.random() * h0, life: 0, maxLife: 12 });
    }
    sparkles = sparkles.filter(s => {
      s.life++;
      if (s.life > s.maxLife) return false;
      const alpha = (1 - s.life / s.maxLife) * 0.8;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,255,240,0.9)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;

    if (bioluminescent && Math.random() < 0.03) {
      bioDots.push({ x: Math.random() * w0, y: Math.random() * h0, life: 0, maxLife: 30 });
    }
    bioDots = bioDots.filter(d => {
      d.life++;
      if (d.life > d.maxLife) return false;
      const alpha = (1 - d.life / d.maxLife) * 0.6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(180,220,255,0.9)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;

    for (const b of butterflies) {
      const phase = t * b.speed + b.t0;
      const x = b.x + Math.sin(phase) * 25;
      const y = b.y + Math.cos(phase * 0.7) * 15;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(b.scale, b.scale);
      ctx.rotate(phase);
      ctx.globalAlpha = 0.7 + 0.2 * Math.sin(phase * 4);
      ctx.fillStyle = 'rgba(255,240,200,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    const stageEl = wrap.querySelector('.codex-lifecycle-stage');
    const dayEl = wrap.querySelector('.codex-lifecycle-day');
    const msgEl = wrap.querySelector('.codex-lifecycle-message');
    if (stageEl) stageEl.textContent = name.replace('_', ' ');
    if (dayEl) dayEl.textContent = overrideStage ? `Preview: ${name}` : `Day ${daysSinceCreation}`;
    if (msgEl) {
      msgEl.textContent = message || '';
      msgEl.style.display = message ? 'block' : 'none';
    }

    rafId = requestAnimationFrame(render);
  }

  function init() {
    if (wrap && container.contains(wrap)) return;
    createDOM();
    container.appendChild(wrap);
    resize();
    window.addEventListener('resize', resize);
    overrideStage = null;
    rebuildFromState();
    running = true;
    rafId = requestAnimationFrame(render);
  }

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
