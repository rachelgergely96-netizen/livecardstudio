/**
 * Ambient Sound Engine — interactive Codex demo.
 * Speaker toggle, theme picker (Ocean/Garden/Fire/Cosmic/Celebration), volume slider.
 * Uses the global AmbientSoundEngine from ambient-sound-engine.js (IIFE).
 */

const THEMES = [
  { key: 'ocean', label: 'Ocean', icon: '🌊' },
  { key: 'garden', label: 'Garden', icon: '🌿' },
  { key: 'fire', label: 'Fire', icon: '🔥' },
  { key: 'starfield', label: 'Cosmic', icon: '✨' },
  { key: 'celebration', label: 'Celebration', icon: '🎉' },
];

const CARD_PALETTES = {
  ocean:       { bg: '#0E1218', blobs: ['40,60,90','30,50,80','50,70,100'] },
  garden:      { bg: '#F5EFE0', blobs: ['200,185,160','180,200,170','210,180,180'], light: true },
  fire:        { bg: '#1A1008', blobs: ['100,60,20','80,40,10','60,30,8'] },
  starfield:   { bg: '#1C1926', blobs: ['55,40,95','95,70,135','130,100,55'] },
  celebration: { bg: '#1A0A14', blobs: ['120,40,80','80,30,100','140,60,60'] },
};

export function createAmbientSoundDemo(container) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let wrap = null;
  let engine = null;
  let playing = false;
  let currentTheme = 'ocean';
  let c0 = null, c1 = null;
  let x0 = null, x1 = null;
  let cardEl = null;
  let rafId = null;
  let running = false;
  let particles = [];
  let blobs = [];
  const w0 = 400, h0 = 600;

  function buildParticles(theme) {
    particles = [];
    const count = 25;
    for (let i = 0; i < count; i++) {
      if (theme === 'ocean' || theme === 'starfield') {
        particles.push({ type: 'star', x: Math.random()*w0, y: Math.random()*h0, sz: .4+Math.random()*1.2, ph: Math.random()*6.28, sp: .002+Math.random()*.003, gold: Math.random()<.5, vx: (Math.random()-.5)*.03, vy: (Math.random()-.5)*.02 });
      } else if (theme === 'garden') {
        const isPollen = Math.random() > .7;
        particles.push({ type: isPollen?'pollen':'petal', x: Math.random()*w0, y: isPollen?Math.random()*h0:-10-Math.random()*200, size: isPollen?1+Math.random()*1.3:2.5+Math.random()*5, vy: isPollen?-(0.02+Math.random()*.05):.08+Math.random()*.2, vx: (Math.random()-.5)*.12, rot: Math.random()*6.28, rotS: (Math.random()-.5)*.005, ph: Math.random()*6.28, drift: .0005+Math.random()*.001, op: .04+Math.random()*.1, shape: Math.random() });
      } else if (theme === 'fire') {
        particles.push({ type: 'ember', x: Math.random()*w0, y: Math.random()*h0, size: 1+Math.random()*3, vy: -(0.05+Math.random()*.15), vx: (Math.random()-.5)*.06, ph: Math.random()*6.28, drift: .0004+Math.random()*.001, op: .08+Math.random()*.2, warm: Math.random() });
      } else {
        particles.push({ type: 'confetti', x: Math.random()*w0, y: -10-Math.random()*h0, size: 2+Math.random()*4, vy: .15+Math.random()*.4, vx: (Math.random()-.5)*.3, rot: Math.random()*6.28, rotS: (Math.random()-.5)*.02, ph: Math.random()*6.28, op: .15+Math.random()*.3, hue: Math.random()*360 });
      }
    }
  }

  function buildBlobs(theme) {
    const pal = CARD_PALETTES[theme] || CARD_PALETTES.starfield;
    blobs = pal.blobs.map(c => ({ x: Math.random()*400, y: Math.random()*600, r: 80+Math.random()*100, c, a: pal.light?.03:.08+Math.random()*.04, ph: Math.random()*6.28 }));
  }

  function resize() {
    if (!cardEl || !c0 || !c1) return;
    const r = cardEl.getBoundingClientRect();
    [c0, c1].forEach(canvas => {
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  function render(t) {
    if (!running || !x0 || !x1) return;
    const w = c0.width/dpr, h = c0.height/dpr;
    const pal = CARD_PALETTES[currentTheme] || CARD_PALETTES.starfield;
    x0.fillStyle = pal.bg;
    x0.fillRect(0, 0, w, h);
    for (const b of blobs) {
      const bx = b.x*(w/400)+Math.sin(t*.0004+b.ph)*30;
      const by = b.y*(h/600)+Math.cos(t*.0003+b.ph)*20;
      const a = b.a*(.5+.5*Math.sin(t*.001+b.ph));
      const g = x0.createRadialGradient(bx,by,0,bx,by,b.r);
      g.addColorStop(0,`rgba(${b.c},${a})`); g.addColorStop(1,`rgba(${b.c},0)`);
      x0.fillStyle = g; x0.fillRect(0,0,w,h);
    }
    x1.clearRect(0,0,w,h);
    const sx = w/w0, sy = h/h0;
    for (const p of particles) {
      const px = p.x*sx, py = p.y*sy;
      if (p.type==='star') {
        const gl = Math.pow(Math.max(0,Math.sin(t*p.sp+p.ph)),3);
        p.x += p.vx+Math.sin(t*.0004+p.ph)*.06; p.y += p.vy;
        if(p.x<-3)p.x=w0+3;if(p.x>w0+3)p.x=-3;if(p.y<-3)p.y=h0+3;if(p.y>h0+3)p.y=-3;
        const col = p.gold?`rgba(201,169,110,${.1+gl*.6})`:`rgba(200,195,220,${.08+gl*.4})`;
        x1.globalAlpha = .1+gl*.55; x1.beginPath(); x1.arc(px,py,p.sz*(.3+gl*.7)*sx,0,Math.PI*2); x1.fillStyle=col; x1.fill();
        if(gl>.4){const sg=x1.createRadialGradient(px,py,0,px,py,p.sz*5*sx);sg.addColorStop(0,`rgba(${p.gold?'201,169,110':'200,195,220'},${gl*.08})`);sg.addColorStop(1,'rgba(0,0,0,0)');x1.fillStyle=sg;x1.fillRect(px-p.sz*5*sx,py-p.sz*5*sy,p.sz*10*sx,p.sz*10*sy)}
      } else if (p.type==='petal'||p.type==='pollen') {
        p.x+=p.vx+Math.sin(t*(p.drift||.001)+p.ph)*.2;p.y+=p.vy;p.rot=(p.rot||0)+(p.rotS||0);
        if(p.type==='petal'&&p.y>h0+8){p.y=-8;p.x=Math.random()*w0}
        if(p.type==='pollen'&&p.y<-4){p.y=h0+4;p.x=Math.random()*w0}
        x1.save();x1.translate(px,py);x1.rotate(p.rot);
        x1.globalAlpha=(p.op||.1)*(.4+.6*Math.sin(t*.001+p.ph));
        if(p.type==='petal'){const s=p.size*sx,pw=s*(.3+(p.shape||0)*.18);x1.beginPath();x1.moveTo(0,-s);x1.bezierCurveTo(pw,-s*.5,pw*.8,s*.3,0,s);x1.bezierCurveTo(-pw*.6,s*.4,-pw*.9,-s*.3,0,-s);x1.fillStyle=`rgba(180,150,155,.35)`;x1.fill()}
        else{const r=p.size*2.5*sx;const gr=x1.createRadialGradient(0,0,0,0,0,r);gr.addColorStop(0,`rgba(200,185,140,${(p.op||.1)*.4})`);gr.addColorStop(1,'rgba(200,185,140,0)');x1.fillStyle=gr;x1.fillRect(-r,-r,r*2,r*2)}
        x1.restore();
      } else if (p.type==='ember') {
        p.x+=p.vx+Math.sin(t*(p.drift||.0006)+p.ph)*.15;p.y+=p.vy;
        if(p.y<-5){p.y=h0+5;p.x=Math.random()*w0}
        const ep=.5+.5*Math.sin(t*.003+p.ph);
        x1.globalAlpha=p.op*ep;
        const r=p.size*sx;const c=p.warm>.5?'255,180,60':'255,140,40';
        const gr=x1.createRadialGradient(px,py,0,px,py,r*3);
        gr.addColorStop(0,`rgba(${c},${p.op*ep*.5})`);gr.addColorStop(1,`rgba(${c},0)`);
        x1.fillStyle=gr;x1.fillRect(px-r*3,py-r*3,r*6,r*6);
        x1.beginPath();x1.arc(px,py,r*.4,0,Math.PI*2);
        x1.fillStyle=`rgba(255,255,200,${ep*.6})`;x1.fill();
      } else if (p.type==='confetti') {
        p.x+=p.vx+Math.sin(t*.001+p.ph)*.4;p.y+=p.vy;p.rot+=p.rotS;
        if(p.y>h0+10){p.y=-10;p.x=Math.random()*w0;p.vx=(Math.random()-.5)*.3}
        x1.save();x1.translate(px,py);x1.rotate(p.rot);
        x1.globalAlpha=p.op*(.5+.5*Math.sin(t*.002+p.ph));
        x1.fillStyle=`hsla(${p.hue},70%,65%,${p.op})`;
        const s=p.size*sx;
        if(Math.random()>.5){x1.fillRect(-s,-s*.3,s*2,s*.6)}
        else{x1.beginPath();x1.arc(0,0,s*.5,0,Math.PI*2);x1.fill()}
        x1.restore();
      }
    }
    x1.globalAlpha = 1;
    rafId = requestAnimationFrame(render);
  }

  function switchTheme(theme) {
    currentTheme = theme;
    buildBlobs(theme);
    buildParticles(theme);
    if (engine) {
      engine.stop();
      engine = null;
    }
    if (playing && window.AmbientSoundEngine) {
      engine = new window.AmbientSoundEngine(theme);
      engine.start();
      const slider = wrap && wrap.querySelector('.ambient-vol-slider');
      if (slider) engine.setVolume(parseInt(slider.value,10)/100);
    }
    // Update active button
    if (wrap) {
      wrap.querySelectorAll('.ambient-theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
      });
    }
  }

  function togglePlay() {
    if (!window.AmbientSoundEngine) return;
    if (playing) {
      playing = false;
      if (engine) { engine.stop(); engine = null; }
    } else {
      playing = true;
      engine = new window.AmbientSoundEngine(currentTheme);
      engine.start();
      const slider = wrap && wrap.querySelector('.ambient-vol-slider');
      if (slider) engine.setVolume(parseInt(slider.value,10)/100);
    }
    updateSpeakerBtn();
  }

  function updateSpeakerBtn() {
    const btn = wrap && wrap.querySelector('.ambient-speaker-btn');
    if (btn) {
      btn.textContent = playing ? '🔊' : '🔈';
      btn.classList.toggle('active', playing);
    }
  }

  return {
    init(containerEl) {
      if (!containerEl) return;
      wrap = document.createElement('div');
      wrap.className = 'codex-demo-wrap';
      wrap.innerHTML = `
        <div class="codex-demo-card ambient-demo-card" style="aspect-ratio:5/7;max-width:300px;width:100%;position:relative;border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.08);">
          <canvas class="c0" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
          <canvas class="c1" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>
          <button type="button" class="ambient-speaker-btn" aria-label="Toggle ambient sound">🔈</button>
        </div>
        <div class="ambient-controls">
          <div class="ambient-themes">
            ${THEMES.map(t => `<button type="button" class="ambient-theme-btn${t.key===currentTheme?' active':''}" data-theme="${t.key}">${t.icon} ${t.label}</button>`).join('')}
          </div>
          <div class="ambient-vol-wrap">
            <span class="ambient-vol-label">Volume</span>
            <input type="range" class="ambient-vol-slider" min="0" max="100" value="70" aria-label="Volume">
          </div>
        </div>
      `;
      containerEl.appendChild(wrap);

      cardEl = wrap.querySelector('.codex-demo-card');
      c0 = wrap.querySelector('.c0');
      c1 = wrap.querySelector('.c1');
      x0 = c0.getContext('2d');
      x1 = c1.getContext('2d');

      resize();
      window.addEventListener('resize', resize);
      buildBlobs(currentTheme);
      buildParticles(currentTheme);

      wrap.querySelector('.ambient-speaker-btn').addEventListener('click', togglePlay);
      wrap.querySelectorAll('.ambient-theme-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTheme(btn.dataset.theme));
      });
      wrap.querySelector('.ambient-vol-slider').addEventListener('input', (e) => {
        if (engine) engine.setVolume(parseInt(e.target.value,10)/100);
      });

      running = true;
      rafId = requestAnimationFrame(render);
    },
    destroy() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (engine) { engine.stop(); engine = null; }
      playing = false;
      window.removeEventListener('resize', resize);
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      wrap = null; cardEl = null; c0 = null; c1 = null; x0 = null; x1 = null;
    }
  };
}
