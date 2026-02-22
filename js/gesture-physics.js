/**
 * Gesture Physics Engine — LiveCard Studio
 * TILT (DeviceOrientation) · BLOW (mic RMS) · SHAKE (DeviceMotion)
 * Layers on top of existing particle render loop. Vanilla JS, iOS-safe.
 */

const DAMPING = 0.97;
const GRAVITY_SCALE = 0.02;
const BLOW_THRESHOLD = 0.15;
const BLOW_FRAMES = 3;
const BLOW_FORCE = 3;
const SHAKE_THRESHOLD = 25;
const SHAKE_FRAMES = 2;
const SHAKE_BURST_MIN = 3;
const SHAKE_BURST_MAX = 6;
const WIND_LINE_FRAMES = 20;
const SCREEN_SHAKE_FRAMES = 10;
const SCREEN_SHAKE_PX = 3;
const BADGE_FADE_MS = 2000;
const GRAVITY_ARROW_OPACITY = 0.2;

export class GesturePhysicsEngine {
  constructor() {
    this._canvasEl = null;
    this._particles = [];
    this._gravityX = 0;
    this._gravityY = 0;
    this._active = false;
    this._tiltPermissionAsked = false;
    this._orientHandler = null;
    this._motionHandler = null;
    this._mouseHandler = null;
    this._blowFrames = 0;
    this._shakeFrames = 0;
    this._windLines = [];
    this._screenShakeUntil = 0;
    this._burstParticles = [];
    this._gestureBadge = null;
    this._gestureBadgeUntil = 0;
    this._audioCtx = null;
    this._analyser = null;
    this._stream = null;
    this._source = null;
    this._dataArray = null;
    this._freqData = null;
    this._micReady = false;
  }

  get gravityX() { return this._gravityX; }
  get gravityY() { return this._gravityY; }
  get gestureBadge() {
    if (performance.now() < this._gestureBadgeUntil) return this._gestureBadge;
    return null;
  }
  get screenShakeOffset() {
    if (performance.now() >= this._screenShakeUntil) return { x: 0, y: 0 };
    const t = (this._screenShakeUntil - performance.now()) / (SCREEN_SHAKE_FRAMES * 16);
    const ease = Math.min(1, t * 2);
    return {
      x: (Math.random() - 0.5) * 2 * SCREEN_SHAKE_PX * ease,
      y: (Math.random() - 0.5) * 2 * SCREEN_SHAKE_PX * ease,
    };
  }
  get windLines() { return this._windLines; }

  /**
   * Start the engine. Call once per card; call update() each frame from your render loop.
   * @param {HTMLCanvasElement} canvasEl - Card canvas (used for desktop mouse gravity and bounds)
   * @param {Array<{x,y,vx?,vy?}>} particlesArray - Same array your render loop draws; velocities are mutated.
   */
  start(canvasEl, particlesArray) {
    if (this._active) return;
    this._canvasEl = canvasEl;
    this._particles = particlesArray;
    this._active = true;

    const hasOrientation = typeof DeviceOrientationEvent !== 'undefined';
    const needsTiltPermission = hasOrientation && typeof DeviceOrientationEvent.requestPermission === 'function';
    const hasMotion = typeof DeviceMotionEvent !== 'undefined';

    if (hasOrientation) {
      this._orientHandler = (e) => this._onOrientation(e);
      if (!needsTiltPermission) {
        window.addEventListener('deviceorientation', this._orientHandler, { passive: true });
      }
    }

    const isDesktop = !hasOrientation || !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isDesktop && canvasEl) {
      this._mouseHandler = (e) => this._onMouse(e);
      canvasEl.addEventListener('mousemove', this._mouseHandler, { passive: true });
      canvasEl.addEventListener('mouseleave', () => { this._gravityX = 0; this._gravityY = 0; }, { passive: true });
    }

    if (hasMotion) {
      this._motionHandler = (e) => this._onMotion(e);
      window.addEventListener('devicemotion', this._motionHandler, { passive: true });
    }
  }

  /**
   * iOS 13+: call from a user gesture (e.g. button click). Returns true if already granted or not required.
   */
  async requestTiltPermission() {
    if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') return true;
    if (this._tiltPermissionAsked) return true;
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      this._tiltPermissionAsked = true;
      if (perm === 'granted' && this._orientHandler) {
        window.addEventListener('deviceorientation', this._orientHandler, { passive: true });
      }
      return perm === 'granted';
    } catch (e) {
      return false;
    }
  }

  _onOrientation(e) {
    const gamma = e.gamma != null ? e.gamma : 0;
    const beta = e.beta != null ? e.beta : 0;
    this._updateTiltFromOrientation(gamma, beta);
    if (Math.abs(this._gravityX) > 0.1 || Math.abs(this._gravityY) > 0.1) {
      this._showBadge('Tilting...');
    }
  }

  _updateTiltFromOrientation(gamma, beta) {
    // gamma: left/right -90..90 → X; beta: front/back -180..180 → Y
    let gx = (gamma / 90) * 2;
    let gy = ((beta - 90) / 90) * 2;
    const mag = Math.hypot(gx, gy);
    if (mag > 2) {
      const s = 2 / mag;
      gx *= s;
      gy *= s;
    }
    this._gravityX = gx;
    this._gravityY = gy;
  }

  _onMouse(e) {
    if (!this._canvasEl) return;
    const r = this._canvasEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    const mag = Math.hypot(dx, dy);
    if (mag > 0.01) {
      const s = Math.min(1, mag) * 2 / Math.max(0.01, mag);
      this._gravityX = dx * s;
      this._gravityY = dy * s;
    } else {
      this._gravityX = 0;
      this._gravityY = 0;
    }
  }

  _onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const x = a.x != null ? a.x : 0;
    const y = a.y != null ? a.y : 0;
    const z = a.z != null ? a.z : 0;
    const mag = Math.sqrt(x * x + y * y + z * z); // magnitude threshold 25
    if (mag >= SHAKE_THRESHOLD) {
      this._shakeFrames++;
      if (this._shakeFrames >= SHAKE_FRAMES) {
        this._triggerShake();
        this._shakeFrames = 0;
      }
    } else {
      this._shakeFrames = 0;
    }
  }

  _triggerShake() {
    const now = performance.now();
    this._screenShakeUntil = now + SCREEN_SHAKE_FRAMES * 16;
    this._showBadge('Shake!');
    const w0 = 400, h0 = 600;
    const cx = w0 / 2, cy = h0 / 2;
    for (const p of this._particles) {
      const angle = Math.random() * Math.PI * 2;
      const force = SHAKE_BURST_MIN + Math.random() * (SHAKE_BURST_MAX - SHAKE_BURST_MIN);
      p.vx = (p.vx || 0) + Math.cos(angle) * force;
      p.vy = (p.vy || 0) + Math.sin(angle) * force;
    }
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const force = 2 + Math.random() * 4;
      this._burstParticles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        life: 0,
        maxLife: 40,
        size: 1.5 + Math.random() * 2,
      });
    }
  }

  _showBadge(text) {
    this._gestureBadge = text;
    this._gestureBadgeUntil = performance.now() + BADGE_FADE_MS;
  }

  /**
   * Enable blow detection. Reuse an existing analyser/stream if provided (e.g. from sound-reactive module).
   * @param {{ analyser: AnalyserNode, stream?: MediaStream } | null} shared - Optional; if omitted, creates new mic.
   */
  async startMicForBlow(shared = null) {
    if (this._analyser) return true;
    try {
      if (shared && shared.analyser) {
        this._analyser = shared.analyser;
        this._stream = shared.stream || null;
        const bufferLength = this._analyser.frequencyBinCount;
        this._dataArray = new Uint8Array(bufferLength);
        this._freqData = new Uint8Array(bufferLength);
        this._micReady = true;
        return true;
      }
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 256;
      this._analyser.smoothingTimeConstant = 0.3;
      this._source = this._audioCtx.createMediaStreamSource(this._stream);
      this._source.connect(this._analyser);
      const bufferLength = this._analyser.frequencyBinCount;
      this._dataArray = new Uint8Array(bufferLength);
      this._freqData = new Uint8Array(bufferLength);
      this._micReady = true;
      return true;
    } catch (e) {
      console.warn('GesturePhysics: mic failed', e);
      return false;
    }
  }

  stop() {
    this._active = false;
    if (this._orientHandler) {
      window.removeEventListener('deviceorientation', this._orientHandler);
      this._orientHandler = null;
    }
    if (this._motionHandler) {
      window.removeEventListener('devicemotion', this._motionHandler);
      this._motionHandler = null;
    }
    if (this._mouseHandler && this._canvasEl) {
      this._canvasEl.removeEventListener('mousemove', this._mouseHandler);
      this._canvasEl.removeEventListener('mouseleave', this._mouseHandler);
      this._mouseHandler = null;
    }
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
    if (this._source) this._source.disconnect();
    this._source = null;
    this._analyser = null;
    if (this._audioCtx && this._audioCtx.state !== 'closed') this._audioCtx.close();
    this._audioCtx = null;
    this._dataArray = null;
    this._freqData = null;
    this._micReady = false;
    this._canvasEl = null;
    this._particles = [];
    this._windLines = [];
    this._burstParticles = [];
  }

  update() {
    if (!this._active || !this._particles.length) return;
    const w0 = 400, h0 = 600;

    // 1. TILT: apply gravity acceleration each frame
    for (const p of this._particles) {
      p.vx = (p.vx || 0) + this._gravityX * GRAVITY_SCALE;
      p.vy = (p.vy || 0) + this._gravityY * GRAVITY_SCALE;
    }

    // 2. BLOW: RMS amplitude; trigger when above threshold for 3+ frames. Prefer blow over speech (low-frequency dominance).
    if (this._micReady && this._analyser && this._dataArray) {
      this._analyser.getByteTimeDomainData(this._dataArray);
      let sum = 0;
      for (let i = 0; i < this._dataArray.length; i++) {
        const n = (this._dataArray[i] - 128) / 128;
        sum += n * n;
      }
      const rms = Math.sqrt(sum / this._dataArray.length);
      let isBlow = rms > BLOW_THRESHOLD;
      if (isBlow && this._freqData) {
        this._analyser.getByteFrequencyData(this._freqData);
        const fd = this._freqData;
        let low = 0, mid = 0, high = 0;
        for (let i = 0; i < 8 && i < fd.length; i++) low += fd[i];
        for (let i = 8; i < 32 && i < fd.length; i++) mid += fd[i];
        for (let i = 32; i < fd.length; i++) high += fd[i];
        const total = low + mid + high || 1;
        if (high / total > 0.5) isBlow = false; // blow = low-frequency dominance vs speech
      }
      if (isBlow) {
        this._blowFrames++;
        if (this._blowFrames >= BLOW_FRAMES) {
          this._showBadge('Blow!');
          for (const p of this._particles) {
            p.vy = (p.vy || 0) - BLOW_FORCE * 3;
            p.vx = (p.vx || 0) + (Math.random() - 0.5) * BLOW_FORCE * 2;
          }
          for (let i = 0; i < 4; i++) {
            this._windLines.push({
              x: Math.random() * w0,
              y: h0 * (0.3 + Math.random() * 0.5),
              curve: (Math.random() - 0.5) * 80,
              life: 0,
              maxLife: WIND_LINE_FRAMES,
            });
          }
          this._blowFrames = 0;
        }
      } else {
        this._blowFrames = 0;
      }
    }

    // 3. Velocity damping (0.97 per frame)
    for (const p of this._particles) {
      p.vx = (p.vx || 0) * DAMPING;
      p.vy = (p.vy || 0) * DAMPING;
    }

    // 4. Boundary wrapping: exit one edge → re-enter opposite
    for (const p of this._particles) {
      if (p.x < -5) p.x = w0 + 5;
      if (p.x > w0 + 5) p.x = -5;
      if (p.y < -5) p.y = h0 + 5;
      if (p.y > h0 + 5) p.y = -5;
    }

    // Wind lines age
    this._windLines = this._windLines.filter(w => {
      w.life++;
      return w.life < w.maxLife;
    });

    // Burst particles
    this._burstParticles = this._burstParticles.filter(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.life++;
      return b.life < b.maxLife;
    });
  }
}

const GOLD_PALETTE = {
  bg: '#1C1926',
  blobs: ['55,40,95', '95,70,135', '130,100,55'],
  goldRate: 0.6,
};

export function createGesturePhysicsDemo(container) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let wrap = null;
  let cardEl = null;
  let c0 = null, c1 = null;
  let x0 = null, x1 = null;
  let engine = null;
  let rafId = null;
  let running = false;
  let particles = [];
  let blobs = [];
  const w0 = 400, h0 = 600;

  function createDOM() {
    wrap = document.createElement('div');
    wrap.className = 'codex-demo-wrap';
    wrap.innerHTML = `
      <div class="codex-demo-card codex-demo-gesture" style="aspect-ratio:5/7;max-width:300px;width:100%;position:relative;border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.08);">
        <canvas class="c0" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
        <canvas class="c1" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
        <div class="codex-gesture-badge" style="display:none;position:absolute;top:10px;right:10px;z-index:5;padding:6px 12px;border-radius:12px;background:rgba(0,0,0,.5);color:rgba(255,255,255,.95);font-size:.6rem;font-weight:500;letter-spacing:.5px;pointer-events:none;"></div>
        <div class="codex-gesture-overlay" style="position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;background:rgba(28,25,38,.2);backdrop-filter:blur(4px);transition:opacity .3s;">
          <div style="text-align:center;pointer-events:auto;">
            <button type="button" class="codex-mic-btn codex-gesture-tilt-btn" style="margin:4px;">📱 Enable Tilt (iOS)</button>
            <button type="button" class="codex-mic-btn codex-gesture-mic-btn" style="margin:4px;">🎙️ Enable Mic (Blow)</button>
            <p style="font-size:.55rem;color:rgba(255,255,255,.7);margin-top:8px;">Desktop: move mouse over card for gravity</p>
            <button type="button" class="codex-mic-btn codex-gesture-start" style="margin-top:12px;background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.25);">Start</button>
          </div>
        </div>
      </div>
    `;
    cardEl = wrap.querySelector('.codex-demo-card');
    c0 = wrap.querySelector('.c0');
    c1 = wrap.querySelector('.c1');
    return wrap;
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < 18; i++) {
      particles.push({
        type: 'petal',
        x: Math.random() * w0,
        y: Math.random() * h0,
        size: 2.5 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        rot: Math.random() * 6.28,
        rotS: (Math.random() - 0.5) * 0.008,
        ph: Math.random() * 6.28,
        drift: 0.0005 + Math.random() * 0.001,
        op: 0.06 + Math.random() * 0.12,
        shape: Math.random(),
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

  function render(t) {
    if (!running || !x0 || !x1) return;
    const w = c0.width / dpr;
    const h = c0.height / dpr;
    const sx = w / w0, sy = h / h0;

    if (engine) engine.update();

    const shake = engine ? engine.screenShakeOffset : { x: 0, y: 0 };
    x0.save();
    x1.save();
    x0.translate(shake.x, shake.y);
    x1.translate(shake.x, shake.y);

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

    // Wind lines
    if (engine) {
      for (const wl of engine.windLines) {
        const lifeRatio = wl.life / wl.maxLife;
        const alpha = (1 - lifeRatio) * 0.25;
        x1.strokeStyle = `rgba(255,255,255,${alpha})`;
        x1.lineWidth = 1.5;
        x1.beginPath();
        const x1_ = wl.x * sx, y1_ = wl.y * sy;
        x1.moveTo(x1_, y1_);
        x1.quadraticCurveTo(x1_ + wl.curve, y1_ - 60, x1_ + wl.curve * 0.5, y1_ - 120);
        x1.stroke();
      }
    }

    // Gravity arrow — subtle directional arrow, 20% opacity
    if (engine && (engine.gravityX !== 0 || engine.gravityY !== 0)) {
      const cx = w / 2, cy = h / 2;
      const len = 25;
      const gx = engine.gravityX * len;
      const gy = engine.gravityY * len;
      x1.strokeStyle = `rgba(255,255,255,${GRAVITY_ARROW_OPACITY})`;
      x1.lineWidth = 1.5;
      x1.beginPath();
      x1.moveTo(cx, cy);
      x1.lineTo(cx + gx, cy + gy);
      x1.stroke();
    }

    // Particles
    for (const p of particles) {
      p.x += (p.vx || 0) + Math.sin(t * (p.drift || 0.001) + p.ph) * 0.2;
      p.y += (p.vy || 0);
      p.rot = (p.rot || 0) + (p.rotS || 0);
      const px = p.x * sx, py = p.y * sy;
      x1.save();
      x1.translate(px, py);
      x1.rotate(p.rot);
      x1.globalAlpha = (p.op || 0.1) * (0.4 + 0.6 * Math.sin(t * 0.001 + p.ph));
      const s = p.size * sx, pw = s * (0.3 + (p.shape || 0) * 0.18);
      x1.beginPath();
      x1.moveTo(0, -s);
      x1.bezierCurveTo(pw, -s * 0.5, pw * 0.8, s * 0.3, 0, s);
      x1.bezierCurveTo(-pw * 0.6, s * 0.4, -pw * 0.9, -s * 0.3, 0, -s);
      x1.fillStyle = 'rgba(220,180,185,0.45)';
      x1.fill();
      x1.restore();
    }

    // Burst particles
    if (engine) {
      for (const b of engine._burstParticles) {
        const alpha = 1 - b.life / b.maxLife;
        x1.globalAlpha = alpha;
        x1.fillStyle = `rgba(201,169,110,${alpha})`;
        x1.beginPath();
        x1.arc(b.x * sx, b.y * sy, b.size * sx, 0, Math.PI * 2);
        x1.fill();
      }
    }
    x1.globalAlpha = 1;
    x0.restore();
    x1.restore();

    // Badge
    const badgeEl = wrap && wrap.querySelector('.codex-gesture-badge');
    if (badgeEl && engine) {
      const badge = engine.gestureBadge;
      if (badge) {
        badgeEl.textContent = badge;
        badgeEl.style.display = 'block';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    rafId = requestAnimationFrame(render);
  }

  function init() {
    if (wrap && container.contains(wrap)) return;
    createDOM();
    container.appendChild(wrap);
    resize();
    window.addEventListener('resize', resize);
    initParticles();
    x0 = c0.getContext('2d');
    x1 = c1.getContext('2d');
    engine = new GesturePhysicsEngine();
    engine.start(c1, particles);

    const overlay = wrap.querySelector('.codex-gesture-overlay');
    const tiltBtn = wrap.querySelector('.codex-gesture-tilt-btn');
    const micBtn = wrap.querySelector('.codex-gesture-mic-btn');

    tiltBtn.addEventListener('click', async () => {
      const ok = await engine.requestTiltPermission();
      if (ok) tiltBtn.textContent = '✓ Tilt enabled';
    });

    micBtn.addEventListener('click', async () => {
      const ok = await engine.startMicForBlow();
      if (ok) {
        micBtn.textContent = '✓ Mic on (blow!)';
      }
    });

    const startBtn = wrap.querySelector('.codex-gesture-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
      });
    }

    running = true;
    rafId = requestAnimationFrame(render);
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
