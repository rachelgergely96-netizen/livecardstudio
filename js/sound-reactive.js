/**
 * Sound-Reactive Cards — LiveCard Studio
 * Web Audio API · Frequency analysis · Particle physics
 * Spec: bass → size, mids → hue, highs → sparkle burst
 */

const SMOOTH = 0.15;
const BASS_BINS = [0, 8];
const MIDS_BINS = [8, 32];
const HIGHS_BINS = [32, 64];
const HIGH_SPARKLE_THRESHOLD = 0.4;
const BASS_RING_THRESHOLD = 0.7;

export class SoundReactiveEngine {
  constructor() {
    this._ctx = null;
    this._stream = null;
    this._analyser = null;
    this._source = null;
    this._data = new Uint8Array(128); // fftSize 256 → half for frequency
    this._bass = 0;
    this._mids = 0;
    this._highs = 0;
    this._prevBass = 0;
    this._prevMids = 0;
    this._prevHighs = 0;
    this._active = false;
  }

  get state() {
    return { bass: this._bass, mids: this._mids, highs: this._highs };
  }

  _lerp(prev, next) {
    return prev + (next - prev) * SMOOTH;
  }

  async start() {
    if (this._active) return;
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._analyser = this._ctx.createAnalyser();
      this._analyser.fftSize = 256;
      this._analyser.smoothingTimeConstant = 0.5;
      this._source = this._ctx.createMediaStreamSource(this._stream);
      this._source.connect(this._analyser);
      this._active = true;
      return true;
    } catch (e) {
      console.warn('SoundReactiveEngine: mic access failed', e);
      return false;
    }
  }

  stop() {
    this._active = false;
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
    if (this._source) this._source.disconnect();
    this._source = null;
    this._analyser = null;
    if (this._ctx && this._ctx.state !== 'closed') this._ctx.close();
    this._ctx = null;
    this._bass = this._mids = this._highs = 0;
    this._prevBass = this._prevMids = this._prevHighs = 0;
  }

  update() {
    if (!this._active || !this._analyser) return;
    this._analyser.getByteFrequencyData(this._data);
    const sum = (a, i, j) => {
      let s = 0;
      for (let k = i; k < j && k < this._data.length; k++) s += this._data[k];
      return s / Math.max(1, j - i);
    };
    const rawBass = sum(this._data, BASS_BINS[0], BASS_BINS[1]) / 255;
    const rawMids = sum(this._data, MIDS_BINS[0], MIDS_BINS[1]) / 255;
    const rawHighs = sum(this._data, HIGHS_BINS[0], HIGHS_BINS[1]) / 255;
    this._bass = this._lerp(this._prevBass, rawBass);
    this._mids = this._lerp(this._prevMids, rawMids);
    this._highs = this._lerp(this._prevHighs, rawHighs);
    this._prevBass = this._bass;
    this._prevMids = this._mids;
    this._prevHighs = this._highs;
  }

  getFrequencyData() {
    if (!this._active || !this._analyser) return null;
    this._analyser.getByteFrequencyData(this._data);
    return this._data;
  }
}

const GOLD_PALETTE = {
  bg: '#1C1926',
  blobs: ['55,40,95', '95,70,135', '130,100,55'],
  goldRate: 0.6,
};

/**
 * Creates a sound-reactive card demo.
 * @param {HTMLElement} container - Parent element
 * @returns {{ init: () => void, destroy: () => void }}
 */
export function createSoundReactiveDemo(container) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let wrap = null;
  let cardEl = null;
  let c0 = null, c1 = null;
  let x0 = null, x1 = null;
  let engine = null;
  let rafId = null;
  let running = false;
  let micBtn = null;
  let tooltip = null;
  let particles = [];
  let blobs = [];
  let sparkles = [];
  let bassRings = [];
  const w0 = 400, h0 = 600;

  function createDOM() {
    wrap = document.createElement('div');
    wrap.className = 'codex-demo-wrap';
    wrap.innerHTML = `
      <div class="codex-demo-card codex-demo-sound" style="aspect-ratio:5/7;max-width:300px;width:100%;position:relative;border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.08);">
        <canvas class="c0" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
        <canvas class="c1" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
        <div class="codex-mic-overlay" style="position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;background:rgba(28,25,38,.25);backdrop-filter:blur(8px);">
          <button type="button" class="codex-mic-btn" aria-label="Enable microphone">🎙️ Enable Microphone</button>
          <p class="codex-mic-tooltip" style="display:none;position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:.6rem;color:rgba(255,255,255,.8);white-space:nowrap;">Mic access needed for sound-reactive mode</p>
        </div>
      </div>
    `;
    cardEl = wrap.querySelector('.codex-demo-card');
    c0 = wrap.querySelector('.c0');
    c1 = wrap.querySelector('.c1');
    micBtn = wrap.querySelector('.codex-mic-btn');
    tooltip = wrap.querySelector('.codex-mic-tooltip');
    return wrap;
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        type: 'star',
        x: Math.random() * w0,
        y: Math.random() * h0,
        sz: 0.4 + Math.random() * 1.2,
        baseSz: 0.4 + Math.random() * 1.2,
        ph: Math.random() * 6.28,
        sp: 0.002 + Math.random() * 0.003,
        gold: Math.random() < (GOLD_PALETTE.goldRate || 0.5),
        vx: (Math.random() - 0.5) * 0.03,
        vy: (Math.random() - 0.5) * 0.02,
        hue: 0,
      });
    }
    blobs = GOLD_PALETTE.blobs.map(c => ({
      x: Math.random() * 400,
      y: Math.random() * 600,
      r: 80 + Math.random() * 100,
      c,
      a: 0.08 + Math.random() * 0.04,
      ph: Math.random() * 6.28,
    }));
  }

  function resize() {
    if (!cardEl || !c0 || !c1) return;
    const r = cardEl.getBoundingClientRect();
    [c0, c1].forEach(canvas => {
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  function drawBassRing(ctx, w, h, t) {
    const rings = bassRings.filter(r => r.radius < 200);
    rings.forEach(r => {
      r.radius += 3;
      r.phase += 0.2;
      const alpha = Math.max(0, 0.4 * (1 - (r.radius - 20) / 130));
      ctx.strokeStyle = `rgba(201,169,110,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const cx = w / 2, cy = h / 2;
      for (let i = 0; i <= 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const wobble = Math.sin(angle * 3 + r.phase) * 4;
        const rad = (r.radius + wobble) * Math.min(w, h) / 400;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });
  }

  function drawFreqBars(ctx, w, h) {
    if (!engine || !engine._active) return;
    const data = engine.getFrequencyData();
    if (!data) return;
    const barCount = 32;
    const barW = w / barCount;
    const maxH = h * 0.12;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * data.length);
      const val = (data[idx] || 0) / 255;
      const barH = val * maxH;
      const x = i * barW;
      const grad = ctx.createLinearGradient(x, h, x, h - barH);
      grad.addColorStop(0, 'rgba(201,169,110,0.4)');
      grad.addColorStop(1, 'rgba(201,169,110,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, h - barH, barW - 1, barH);
    }
    ctx.globalAlpha = 1;
  }

  function render(t) {
    if (!running || !x0 || !x1) return;
    const w = c0.width / dpr;
    const h = c0.height / dpr;
    const sx = w / w0, sy = h / h0;

    const state = engine ? engine.state : { bass: 0, mids: 0, highs: 0 };
    if (engine && engine._active) engine.update();

    const sizeMul = 1 + state.bass * 2;
    const hueShift = state.mids * 60;

    if (state.highs > HIGH_SPARKLE_THRESHOLD && Math.random() < 0.15) {
      for (let i = 0; i < 5 + Math.floor(Math.random() * 6); i++) {
        sparkles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          life: 0,
          maxLife: 15 + Math.random() * 15,
          size: 2 + Math.random() * 4,
        });
      }
    }

    if (state.bass > BASS_RING_THRESHOLD && (bassRings.length === 0 || t - (bassRings[bassRings.length - 1]?.t || 0) > 200)) {
      bassRings.push({ radius: 20, phase: t * 0.003, t });
    }

    x0.fillStyle = GOLD_PALETTE.bg;
    x0.fillRect(0, 0, w, h);
    for (const b of blobs) {
      const bx = b.x * (w / 400) + Math.sin(t * 0.0004 + b.ph) * 30;
      const by = b.y * (h / 600) + Math.cos(t * 0.0003 + b.ph) * 20;
      const a = b.a * (0.5 + 0.5 * Math.sin(t * 0.001 + b.ph));
      const g = x0.createRadialGradient(bx, by, 0, bx, by, b.r);
      g.addColorStop(0, `rgba(${b.c},${a})`);
      g.addColorStop(1, `rgba(${b.c},0)`);
      x0.fillStyle = g;
      x0.fillRect(0, 0, w, h);
    }

    x1.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx + Math.sin(t * 0.0004 + p.ph) * 0.06;
      p.y += p.vy;
      if (p.x < -3) p.x = w0 + 3;
      if (p.x > w0 + 3) p.x = -3;
      if (p.y < -3) p.y = h0 + 3;
      if (p.y > h0 + 3) p.y = -3;
      const px = p.x * sx, py = p.y * sy;
      const gl = Math.pow(Math.max(0, Math.sin(t * p.sp + p.ph)), 3);
      const sz = (p.baseSz || p.sz) * (0.3 + gl * 0.7) * sx * sizeMul;
      const hue = (p.gold ? 45 : 260) + hueShift;
      const col = `hsla(${hue},40%,65%,${0.1 + gl * 0.55})`;
      x1.globalAlpha = 0.1 + gl * 0.55;
      x1.beginPath();
      x1.arc(px, py, sz, 0, Math.PI * 2);
      x1.fillStyle = col;
      x1.fill();
      if (gl > 0.4) {
        const sg = x1.createRadialGradient(px, py, 0, px, py, sz * 5);
        sg.addColorStop(0, `hsla(${hue},40%,70%,${gl * 0.08})`);
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        x1.fillStyle = sg;
        x1.fillRect(px - sz * 5, py - sz * 5, sz * 10, sz * 10);
      }
    }

    sparkles = sparkles.filter(s => {
      s.life++;
      if (s.life > s.maxLife) return false;
      const alpha = 1 - s.life / s.maxLife;
      x1.globalAlpha = alpha;
      x1.fillStyle = `rgba(255,255,220,${alpha})`;
      x1.beginPath();
      x1.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      x1.fill();
      return true;
    });
    x1.globalAlpha = 1;

    drawBassRing(x1, w, h, t);
    drawFreqBars(x1, w, h);

    bassRings = bassRings.filter(r => r.radius < 200);

    rafId = requestAnimationFrame(render);
  }

  function loop(t) {
    render(t);
  }

  function init() {
    if (wrap && container.contains(wrap)) return;
    createDOM();
    container.appendChild(wrap);
    resize();
    window.addEventListener('resize', resize);
    initParticles();
    engine = new SoundReactiveEngine();

    micBtn.addEventListener('click', async () => {
      const ok = await engine.start();
      if (ok) {
        micBtn.parentElement.style.display = 'none';
      } else {
        if (tooltip) tooltip.style.display = 'block';
        setTimeout(() => { if (tooltip) tooltip.style.display = 'none'; }, 3000);
      }
    });

    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function destroy() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (engine) engine.stop();
    engine = null;
    window.removeEventListener('resize', resize);
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    wrap = null;
  }

  return { init, destroy };
}
