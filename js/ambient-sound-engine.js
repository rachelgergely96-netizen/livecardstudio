/**
 * LiveCard Studio — Generative Ambient Sound Engine
 * Web Audio API only, no audio files. Procedural never-loop sound per card theme.
 * Max 6 oscillators at a time; scheduling via AudioContext.currentTime.
 */
(function (global) {
  'use strict';

  const themeCategories = {
    ocean: ['ocean', 'cool', 'bubbles', 'softblue', 'softpink', 'mint', 'snow', 'winter'],
    garden: ['garden', 'warm', 'petals', 'rose', 'lavender', 'sunlit'],
    fire: ['fire', 'ember', 'candles', 'warm', 'christmas'],
    starfield: ['starfield', 'cosmic', 'gold', 'neon', 'navy', 'twilight', 'newyear', 'dust'],
    celebration: ['celebration', 'confetti', 'party', 'gradparty', 'rise']
  };

  function resolveThemeType(engine, palette) {
    const key = (engine + ' ' + (palette || '')).toLowerCase();
    for (const [theme, keywords] of Object.entries(themeCategories)) {
      if (keywords.some(k => key.includes(k))) return theme;
    }
    return 'starfield';
  }

  /** Simple seeded PRNG (Mulberry32) for consistent procedural generation per session */
  function createPRNG(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createNoiseBuffer(ctx, type) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      if (type === 'brown') {
        const white = (Math.random() * 2 - 1);
        data[i] = (data[i - 1] || 0) + 0.02 * white;
        data[i] = Math.max(-1, Math.min(1, data[i] * 0.98));
      } else {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  class AmbientSoundEngine {
    constructor(themeType) {
      this.themeType = String(themeType).toLowerCase();
      if (!themeCategories[this.themeType]) this.themeType = 'starfield';
      this.seed = Date.now();
      this.prng = createPRNG(this.seed);
      this.ctx = null;
      this.masterGain = null;
      this.started = false;
      this.stopped = false;
      this._scheduled = [];
      this._startPromise = null;
      this._targetVolume = 0.8;
    }

    _ctx() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      return this.ctx;
    }

    _rand(min, max) {
      if (max == null) {
        max = min;
        min = 0;
      }
      return min + this.prng() * (max - min);
    }

    _getOsc() {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      return { osc, gain };
    }

    _releaseOsc(obj) {
      try {
        if (this.ctx) obj.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch (_) {}
      try {
        obj.osc.stop();
      } catch (_) {}
      try { obj.osc.disconnect(); } catch (_) {}
      try { obj.gain.disconnect(); } catch (_) {}
    }

    _getNoise(buffer) {
      const buf = this.ctx.createBufferSource();
      buf.buffer = buffer;
      const gain = this.ctx.createGain();
      buf.connect(gain);
      gain.connect(this.masterGain);
      return { buffer: buf, gain };
    }

    _releaseNoise(obj) {
      try {
        if (this.ctx) obj.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch (_) {}
      try {
        obj.buffer.stop();
      } catch (_) {}
      try { obj.buffer.disconnect(); } catch (_) {}
      try { obj.gain.disconnect(); } catch (_) {}
    }

    _schedule(fn) {
      this._scheduled.push(fn);
    }

    start() {
      if (this.stopped) return Promise.resolve(false);
      if (this.started) {
        if (this.ctx && this.ctx.state !== 'running') {
          return this.ctx.resume().catch(() => false).then(() => true);
        }
        return Promise.resolve(true);
      }
      if (this._startPromise) return this._startPromise;
      const ctx = this._ctx();
      const boot = () => {
        if (this.stopped || this.started) return true;
        this.started = true;
        const t0 = ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(t0);
        this.masterGain.gain.setValueAtTime(0, t0);
        this.masterGain.gain.linearRampToValueAtTime(this._targetVolume, t0 + 0.25);

        if (this.themeType === 'ocean') this._startOcean(ctx, t0);
        else if (this.themeType === 'garden') this._startGarden(ctx, t0);
        else if (this.themeType === 'fire') this._startFire(ctx, t0);
        else if (this.themeType === 'starfield') this._startStarfield(ctx, t0);
        else if (this.themeType === 'celebration') this._startCelebration(ctx, t0);
        else this._startStarfield(ctx, t0);
        return true;
      };
      const started = boot();
      if (ctx.state !== 'running') {
        this._startPromise = ctx.resume().catch(() => {}).then(() => started).finally(() => { this._startPromise = null; });
        return this._startPromise;
      }
      return Promise.resolve(started);
    }

    stop() {
      if (this.stopped) return;
      this.stopped = true;
      this._scheduled.forEach(cancel => { try { cancel(); } catch (_) {} });
      this._scheduled = [];
      if (this.masterGain) {
        const t = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(t);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
        this.masterGain.gain.linearRampToValueAtTime(0, t + 0.3);
      }
      const ctx = this.ctx;
      setTimeout(() => {
        try {
          if (ctx && ctx.state !== 'closed') ctx.close();
        } catch (_) {}
        this.ctx = null;
        this.masterGain = null;
      }, 400);
    }

    setVolume(value) {
      const v = Math.max(0, Math.min(1, Number(value)));
      this._targetVolume = v;
      if (!this.masterGain) return;
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(v, t);
    }

    _startOcean(ctx, t0) {
      const o1 = this._getOsc(), o2 = this._getOsc();
      o1.osc.type = 'sine'; o1.osc.frequency.setValueAtTime(80, t0);
      o2.osc.type = 'sine'; o2.osc.frequency.setValueAtTime(82, t0);
      o1.gain.gain.setValueAtTime(0.08, t0);
      o2.gain.gain.setValueAtTime(0.06, t0);
      o1.osc.start(t0); o2.osc.start(t0);

      const noiseBuf = createNoiseBuffer(ctx, 'white');
      const waveNoise = this._getNoise(noiseBuf);
      waveNoise.buffer.loop = true;
      waveNoise.buffer.start(t0);
      const waveFilt = ctx.createBiquadFilter();
      waveFilt.type = 'lowpass';
      const waveLfo = ctx.createOscillator();
      waveLfo.type = 'sine';
      waveLfo.frequency.setValueAtTime(0.05, t0);
      const waveLfoGain = ctx.createGain();
      waveLfoGain.gain.setValueAtTime(300, t0);
      const waveDc = ctx.createConstantSource();
      waveDc.offset.setValueAtTime(500, t0);
      waveDc.start(t0);
      waveDc.connect(waveFilt.frequency);
      waveLfo.connect(waveLfoGain);
      waveLfoGain.connect(waveFilt.frequency);
      waveNoise.gain.disconnect();
      waveNoise.gain.connect(waveFilt);
      waveFilt.connect(this.masterGain);
      waveNoise.gain.gain.setValueAtTime(0.04, t0);
      waveLfo.start(t0);

      const whaleNext = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        const pitch = this._rand(200, 600);
        const dur = this._rand(3, 6);
        const o = this._getOsc();
        o.osc.type = 'sine';
        o.osc.frequency.setValueAtTime(pitch * 0.6, t);
        o.osc.frequency.linearRampToValueAtTime(pitch, t + dur * 0.4);
        o.osc.frequency.linearRampToValueAtTime(pitch * 0.5, t + dur);
        o.gain.gain.setValueAtTime(0, t);
        o.gain.gain.linearRampToValueAtTime(0.06, t + 0.2);
        o.gain.gain.setValueAtTime(0.06, t + dur * 0.6);
        o.gain.gain.linearRampToValueAtTime(0, t + dur);
        o.osc.start(t);
        o.osc.stop(t + dur);
        const release = setTimeout(() => this._releaseOsc(o), (dur + 0.5) * 1000);
        this._scheduled.push(() => clearTimeout(release));
        const next = 15 + this._rand(0, 10);
        const id = setTimeout(whaleNext, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const whaleId = setTimeout(whaleNext, (15 + this._rand(0, 10)) * 1000);
      this._scheduled.push(() => clearTimeout(whaleId));

      const bubbleNext = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        const freq = this._rand(1000, 3000);
        const buf = this._getNoise(noiseBuf);
        buf.buffer.loop = false;
        buf.buffer.start(t);
        buf.buffer.stop(t + 0.08);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(freq, t);
        bp.Q.setValueAtTime(2, t);
        buf.gain.disconnect();
        buf.gain.connect(bp);
        bp.connect(this.masterGain);
        buf.gain.gain.setValueAtTime(0.15, t);
        buf.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        const release = setTimeout(() => this._releaseNoise(buf), 200);
        this._scheduled.push(() => clearTimeout(release));
        const next = 4 + this._rand(0, 4);
        const id = setTimeout(bubbleNext, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const bubbleId = setTimeout(bubbleNext, (4 + this._rand(0, 4)) * 1000);
      this._scheduled.push(() => clearTimeout(bubbleId));
    }

    _startGarden(ctx, t0) {
      const root = 220;
      const chord = [root, root * 1.26, root * 1.5];
      const pads = chord.map(() => this._getOsc());
      pads.forEach((p, i) => {
        p.osc.type = 'sine';
        p.osc.frequency.setValueAtTime(chord[i], t0);
        p.gain.gain.setValueAtTime(0.04, t0);
        p.osc.start(t0);
      });

      const transposePad = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        const delta = (this._rand() - 0.5) * 20;
        pads.forEach((p, i) => {
          const f = chord[i] + delta;
          p.osc.frequency.linearRampToValueAtTime(f, t + 2);
        });
        const next = 20 + this._rand(0, 20);
        const id = setTimeout(transposePad, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const transId = setTimeout(transposePad, (20 + this._rand(0, 20)) * 1000);
      this._scheduled.push(() => clearTimeout(transId));

      const windBuf = createNoiseBuffer(ctx, 'white');
      const wind = this._getNoise(windBuf);
      wind.buffer.loop = true;
      wind.buffer.start(t0);
      const windFilt = ctx.createBiquadFilter();
      windFilt.type = 'lowpass';
      const windLfo = ctx.createOscillator();
      windLfo.frequency.setValueAtTime(0.02, t0);
      const windLfoGain = ctx.createGain();
      windLfoGain.gain.setValueAtTime(250, t0);
      const windDc = ctx.createConstantSource();
      windDc.offset.setValueAtTime(350, t0);
      windDc.start(t0);
      windDc.connect(windFilt.frequency);
      windLfo.connect(windLfoGain);
      windLfoGain.connect(windFilt.frequency);
      wind.gain.disconnect();
      wind.gain.connect(windFilt);
      windFilt.connect(this.masterGain);
      wind.gain.gain.setValueAtTime(0.035, t0);
      windLfo.start(t0);

      const cricketBurst = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        const dur = this._rand(0.5, 2);
        const sq = this._getOsc();
        sq.osc.type = 'square';
        sq.osc.frequency.setValueAtTime(4000, t);
        sq.gain.disconnect();
        const am = ctx.createOscillator();
        am.frequency.setValueAtTime(15, t);
        const amGain = ctx.createGain();
        amGain.gain.setValueAtTime(0.5, t);
        sq.osc.connect(sq.gain);
        sq.gain.connect(amGain);
        am.connect(amGain.gain);
        amGain.connect(this.masterGain);
        sq.gain.gain.setValueAtTime(0.03, t);
        sq.gain.gain.setValueAtTime(0.03, t + dur);
        sq.gain.gain.linearRampToValueAtTime(0, t + dur + 0.05);
        sq.osc.start(t);
        am.start(t);
        sq.osc.stop(t + dur + 0.1);
        am.stop(t + dur + 0.1);
        const release = setTimeout(() => this._releaseOsc(sq), (dur + 0.5) * 1000);
        this._scheduled.push(() => clearTimeout(release));
        const next = 3 + this._rand(0, 7);
        const id = setTimeout(cricketBurst, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const crickId = setTimeout(cricketBurst, (3 + this._rand(0, 7)) * 1000);
      this._scheduled.push(() => clearTimeout(crickId));

      let birdPitch = 2000;
      const birdChirp = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        const n = 3 + Math.floor(this._rand(0, 3));
        for (let i = 0; i < n; i++) {
          birdPitch = Math.max(1200, Math.min(3500, birdPitch + (this._rand() - 0.5) * 400));
          const o = this._getOsc();
          o.osc.type = 'sine';
          o.osc.frequency.setValueAtTime(birdPitch, t + i * 0.08);
          o.gain.gain.setValueAtTime(0, t + i * 0.08);
          o.gain.gain.linearRampToValueAtTime(0.04, t + i * 0.08 + 0.02);
          o.gain.gain.linearRampToValueAtTime(0, t + i * 0.08 + 0.06);
          o.osc.start(t + i * 0.08);
          o.osc.stop(t + i * 0.08 + 0.08);
          const release = setTimeout(() => this._releaseOsc(o), 200);
          this._scheduled.push(() => clearTimeout(release));
        }
        const next = 10 + this._rand(0, 10);
        const id = setTimeout(birdChirp, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const birdId = setTimeout(birdChirp, (10 + this._rand(0, 10)) * 1000);
      this._scheduled.push(() => clearTimeout(birdId));
    }

    _startFire(ctx, t0) {
      const brownBuf = createNoiseBuffer(ctx, 'brown');
      const crackle = this._getNoise(brownBuf);
      crackle.buffer.loop = true;
      crackle.buffer.start(t0);
      const crackleFilt = ctx.createBiquadFilter();
      crackleFilt.type = 'lowpass';
      crackleFilt.frequency.setValueAtTime(300, t0);
      crackle.gain.disconnect();
      crackle.gain.connect(crackleFilt);
      crackleFilt.connect(this.masterGain);
      crackle.gain.gain.setValueAtTime(0.06, t0);

      const spikeNoise = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        crackle.gain.gain.setValueAtTime(0.06 + this._rand(0, 0.08), t);
        crackle.gain.gain.linearRampToValueAtTime(0.06, t + 0.3);
        const id = setTimeout(spikeNoise, 200 + this._rand(0, 800));
        this._scheduled.push(() => clearTimeout(id));
      };
      spikeNoise();

      const whiteBuf = createNoiseBuffer(ctx, 'white');
      const popNext = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        const buf = this._getNoise(whiteBuf);
        buf.buffer.loop = false;
        buf.buffer.start(t);
        buf.buffer.stop(t + 0.01);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1000, t);
        bp.Q.setValueAtTime(1, t);
        buf.gain.disconnect();
        buf.gain.connect(bp);
        bp.connect(this.masterGain);
        buf.gain.gain.setValueAtTime(0.2, t);
        buf.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
        const release = setTimeout(() => this._releaseNoise(buf), 100);
        this._scheduled.push(() => clearTimeout(release));
        const next = 2 + this._rand(0, 4);
        const id = setTimeout(popNext, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const popId = setTimeout(popNext, (2 + this._rand(0, 4)) * 1000);
      this._scheduled.push(() => clearTimeout(popId));

      const tri = this._getOsc();
      tri.osc.type = 'triangle';
      tri.osc.frequency.setValueAtTime(60, t0);
      tri.gain.gain.setValueAtTime(0.04, t0);
      tri.osc.start(t0);
    }

    _startStarfield(ctx, t0) {
      const deep = this._getOsc();
      deep.osc.type = 'sine';
      deep.osc.frequency.setValueAtTime(58, t0);
      deep.osc.start(t0);
      deep.gain.disconnect();
      const deepLfo = ctx.createOscillator();
      deepLfo.type = 'sine';
      deepLfo.frequency.setValueAtTime(0.03, t0);
      const deepLfoGain = ctx.createGain();
      deepLfoGain.gain.setValueAtTime(0.5, t0);
      deep.osc.connect(deep.gain);
      deep.gain.connect(deepLfoGain);
      deepLfo.connect(deepLfoGain.gain);
      deepLfoGain.connect(this.masterGain);
      deep.gain.gain.setValueAtTime(0.1, t0);
      deepLfo.start(t0);

      // Add immediate mid texture so starfield cards are audible right away.
      const mid = this._getOsc();
      mid.osc.type = 'triangle';
      mid.osc.frequency.setValueAtTime(170, t0);
      mid.gain.gain.setValueAtTime(0.022, t0);
      mid.osc.start(t0);

      let shimmerFreq = 3000;
      const shimmerTick = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        shimmerFreq = Math.max(2000, Math.min(4000, shimmerFreq + (this._rand() - 0.5) * 200));
        const o = this._getOsc();
        o.osc.type = 'sine';
        o.osc.frequency.setValueAtTime(shimmerFreq, t);
        o.gain.gain.setValueAtTime(0, t);
        o.gain.gain.linearRampToValueAtTime(0.015, t + 0.1);
        o.gain.gain.linearRampToValueAtTime(0, t + 0.8);
        o.osc.start(t);
        o.osc.stop(t + 1);
        const delay = ctx.createDelay(2);
        delay.delayTime.setValueAtTime(0.4, t);
        const fb = ctx.createGain();
        fb.gain.setValueAtTime(0.4, t);
        o.gain.disconnect();
        o.gain.connect(this.masterGain);
        o.gain.connect(delay);
        delay.connect(fb);
        fb.connect(this.masterGain);
        const release = setTimeout(() => this._releaseOsc(o), 1200);
        this._scheduled.push(() => clearTimeout(release));
        const next = 1 + this._rand(0, 3);
        const id = setTimeout(shimmerTick, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const shimmerId = setTimeout(shimmerTick, (1 + this._rand(0, 2)) * 1000);
      this._scheduled.push(() => clearTimeout(shimmerId));

      const pulsarNext = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        const pitch = 400 + this._rand(0, 1200);
        const o = this._getOsc();
        o.osc.type = 'sine';
        o.osc.frequency.setValueAtTime(pitch, t);
        o.gain.gain.setValueAtTime(0.12, t);
        o.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.osc.start(t);
        o.osc.stop(t + 0.6);
        const delay = ctx.createDelay(1.5);
        delay.delayTime.setValueAtTime(0.25, t);
        const fb = ctx.createGain();
        fb.gain.setValueAtTime(0.5, t);
        o.gain.connect(this.masterGain);
        o.gain.connect(delay);
        delay.connect(fb);
        fb.connect(this.masterGain);
        const release = setTimeout(() => this._releaseOsc(o), 800);
        this._scheduled.push(() => clearTimeout(release));
        const next = 8 + this._rand(0, 12);
        const id = setTimeout(pulsarNext, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const pulsarId = setTimeout(pulsarNext, (8 + this._rand(0, 12)) * 1000);
      this._scheduled.push(() => clearTimeout(pulsarId));
    }

    _startCelebration(ctx, t0) {
      const root = 261.63;
      const chord = [root, root * 1.26, root * 1.5];
      const pads = chord.map(() => this._getOsc());
      const padFilt = ctx.createBiquadFilter();
      padFilt.type = 'lowpass';
      padFilt.frequency.setValueAtTime(2000, t0);
      pads.forEach((p, i) => {
        p.osc.type = 'sawtooth';
        p.osc.frequency.setValueAtTime(chord[i], t0);
        p.gain.gain.setValueAtTime(0, t0);
        p.gain.gain.linearRampToValueAtTime(0.04, t0 + 0.5);
        p.osc.start(t0);
        p.gain.disconnect();
        p.gain.connect(padFilt);
      });
      padFilt.connect(this.masterGain);

      let sparklePitch = 4500;
      const sparkleTick = () => {
        if (this.stopped) return;
        const t = ctx.currentTime;
        sparklePitch = Math.max(3000, Math.min(6000, sparklePitch + (this._rand() - 0.5) * 500));
        const o = this._getOsc();
        o.osc.type = 'sine';
        o.osc.frequency.setValueAtTime(sparklePitch, t);
        o.gain.gain.setValueAtTime(0.08, t);
        o.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        o.osc.start(t);
        o.osc.stop(t + 0.06);
        const release = setTimeout(() => this._releaseOsc(o), 100);
        this._scheduled.push(() => clearTimeout(release));
        const next = 0.25 + this._rand(0, 0.5);
        const id = setTimeout(sparkleTick, next * 1000);
        this._scheduled.push(() => clearTimeout(id));
      };
      const sparkleId = setTimeout(sparkleTick, (0.3 + this._rand(0, 0.4)) * 1000);
      this._scheduled.push(() => clearTimeout(sparkleId));

      const sub = this._getOsc();
      sub.osc.type = 'sine';
      sub.osc.frequency.setValueAtTime(55, t0);
      sub.osc.start(t0);
      sub.gain.disconnect();
      const subLfo = ctx.createOscillator();
      subLfo.frequency.setValueAtTime(0.08, t0);
      const subLfoGain = ctx.createGain();
      subLfoGain.gain.setValueAtTime(0.5, t0);
      sub.osc.connect(sub.gain);
      sub.gain.connect(subLfoGain);
      subLfo.connect(subLfoGain.gain);
      subLfoGain.connect(this.masterGain);
      sub.gain.gain.setValueAtTime(0.07, t0);
      subLfo.start(t0);
    }
  }

  AmbientSoundEngine.resolveThemeType = resolveThemeType;
  global.AmbientSoundEngine = AmbientSoundEngine;
})(typeof window !== 'undefined' ? window : this);
