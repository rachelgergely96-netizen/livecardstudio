/**
 * NFC Print Bridge — LiveCard Studio
 * QR code generator (no external deps), immersive "gift unwrap" load sequence,
 * client-side analytics, and Codex demo panel.
 */

// ─── Minimal QR Code Encoder ─────────────────────────────────────────────────
// Alphanumeric-mode QR (version 2, error-correction L) for short URLs.
// For the demo, we use a simple matrix generator that produces a valid-looking
// QR-like grid. A production version would use a full QR library.

const QR_SIZE = 25; // 25x25 module grid (QR version 2)

function generateQRMatrix(text) {
  // Deterministic hash-based matrix that looks like a QR code.
  // This produces a visually convincing QR pattern with finder patterns.
  const size = QR_SIZE;
  const matrix = Array.from({ length: size }, () => new Uint8Array(size));

  // Finder patterns (top-left, top-right, bottom-left)
  function drawFinder(ox, oy) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[oy + y][ox + x] = (border || inner) ? 1 : 0;
      }
    }
  }
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Alignment pattern (version 2: position 18)
  const ax = 18, ay = 18;
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      const border = Math.abs(x) === 2 || Math.abs(y) === 2;
      const center = x === 0 && y === 0;
      matrix[ay + y][ax + x] = (border || center) ? 1 : 0;
    }
  }

  // Data area — deterministic from text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  function nextBit() {
    hash = ((hash * 1103515245) + 12345) | 0;
    return ((hash >> 16) & 1);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip reserved areas
      if ((x < 8 && y < 8) || (x >= size - 7 && y < 8) || (x < 8 && y >= size - 7)) continue;
      if (x === 6 || y === 6) continue;
      if (x >= 16 && x <= 20 && y >= 16 && y <= 20) continue;
      matrix[y][x] = nextBit();
    }
  }

  return matrix;
}

/**
 * Generate a styled QR code canvas.
 * @param {string} url - URL to encode
 * @param {{ primary?: string, bg?: string }} palette - Colors
 * @param {number} canvasSize - Output canvas pixel size
 * @returns {HTMLCanvasElement}
 */
export function generateStyledQR(url, palette = {}, canvasSize = 240) {
  const primary = palette.primary || '#2A2520';
  const bg = palette.bg || '#FFFFFF';
  const matrix = generateQRMatrix(url);
  const size = matrix.length;
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  const cellSize = canvasSize / (size + 4); // 2-cell quiet zone each side
  const offset = cellSize * 2;
  const radius = cellSize * 0.35;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Draw modules with rounded corners
  ctx.fillStyle = primary;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!matrix[y][x]) continue;
      const px = offset + x * cellSize;
      const py = offset + y * cellSize;
      const s = cellSize * 0.9;
      const ox = (cellSize - s) / 2;
      const mx = px + ox, my = py + ox;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(mx, my, s, s, radius);
      } else {
        // Fallback for browsers without roundRect
        const r = Math.min(radius, s / 2);
        ctx.moveTo(mx + r, my);
        ctx.arcTo(mx + s, my, mx + s, my + s, r);
        ctx.arcTo(mx + s, my + s, mx, my + s, r);
        ctx.arcTo(mx, my + s, mx, my, r);
        ctx.arcTo(mx, my, mx + s, my, r);
        ctx.closePath();
      }
      ctx.fill();
    }
  }

  // Center logo area — white circle with heart
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const logoR = cellSize * 2.5;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
  ctx.fill();

  // Heart icon in center
  ctx.fillStyle = primary;
  ctx.save();
  ctx.translate(cx, cy - 2);
  const hs = logoR * 0.45;
  ctx.beginPath();
  ctx.moveTo(0, hs * 0.35);
  ctx.bezierCurveTo(-hs * 0.6, -hs * 0.1, -hs * 0.5, -hs * 0.5, 0, -hs * 0.25);
  ctx.bezierCurveTo(hs * 0.5, -hs * 0.5, hs * 0.6, -hs * 0.1, 0, hs * 0.35);
  ctx.fill();
  ctx.restore();

  return canvas;
}

// ─── Immersive Load Sequence ─────────────────────────────────────────────────

/**
 * Play the cinematic NFC card reveal sequence.
 * @param {HTMLElement} containerEl - Fullscreen container
 * @param {{ recipientName?: string, bg?: string, blobs?: string[], particleCount?: number }} config
 * @returns {{ stop: () => void }}
 */
export function playLoadSequence(containerEl, config = {}) {
  const name = config.recipientName || 'Olivia & James';
  const bgColor = config.bg || '#1C1926';
  const blobColors = config.blobs || ['55,40,95', '95,70,135', '130,100,55'];
  const targetParticles = config.particleCount || 30;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  containerEl.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const r = containerEl.getBoundingClientRect();
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  let frame = 0;
  let stopped = false;
  let particles = [];

  // Precompute blob data
  const blobs = blobColors.map(c => ({
    x: Math.random() * 400,
    y: Math.random() * 600,
    r: 80 + Math.random() * 100,
    c,
    a: 0.08 + Math.random() * 0.04,
    ph: Math.random() * 6.28,
  }));

  function render() {
    if (stopped) return;
    frame++;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const cx = w / 2;
    const cy = h / 2;

    // Phase 1: Black with name fade-in (frames 0-60)
    if (frame <= 60) {
      ctx.fillStyle = '#0A0808';
      ctx.fillRect(0, 0, w, h);

      // Faint seed particles in the void
      if (frame > 10) {
        ctx.globalAlpha = Math.min(1, (frame - 10) / 30) * 0.08;
        for (let i = 0; i < 3; i++) {
          const px = cx + Math.sin(frame * 0.01 + i * 2.1) * 60;
          const py = cy + Math.cos(frame * 0.008 + i * 1.7) * 40;
          ctx.fillStyle = 'rgba(201,169,110,0.15)';
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Name fade-in letter by letter
      const nameProgress = Math.min(1, frame / 50);
      const charsToShow = Math.ceil(name.length * nameProgress);
      const visibleName = name.substring(0, charsToShow);
      ctx.font = '300 2rem "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, frame / 40)})`;
      ctx.letterSpacing = '4px';
      ctx.fillText(visibleName, cx, cy);
    }
    // Phase 2: Background bloom (frames 60-150)
    else if (frame <= 150) {
      const progress = (frame - 60) / 90;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      // Lerp from black to bg color
      const parseHex = (hex) => {
        const n = parseInt(hex.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      };
      const [tr, tg, tb] = parseHex(bgColor);
      const r = Math.round(10 + (tr - 10) * eased);
      const g = Math.round(8 + (tg - 8) * eased);
      const b = Math.round(8 + (tb - 8) * eased);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);

      // Blobs expanding from center
      for (const bl of blobs) {
        const bx = cx + (bl.x - 200) * eased * (w / 400);
        const by = cy + (bl.y - 300) * eased * (h / 600);
        const br = bl.r * eased;
        const ba = bl.a * eased;
        const gr = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        gr.addColorStop(0, `rgba(${bl.c},${ba})`);
        gr.addColorStop(1, `rgba(${bl.c},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      }

      // Name shifts upward
      const nameY = cy - progress * h * 0.25;
      ctx.font = '300 2rem "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(255,255,255,${1 - progress * 0.3})`;
      ctx.fillText(name, cx, nameY);
    }
    // Phase 3: Particle spawn ramp (frames 150-270)
    else if (frame <= 270) {
      const progress = (frame - 150) / 120;
      const currentCount = Math.round(targetParticles * progress);

      // Draw full background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      for (const bl of blobs) {
        const bx = bl.x * (w / 400) + Math.sin(frame * 0.004 + bl.ph) * 30;
        const by = bl.y * (h / 600) + Math.cos(frame * 0.003 + bl.ph) * 20;
        const ba = bl.a * (0.5 + 0.5 * Math.sin(frame * 0.01 + bl.ph));
        const gr = ctx.createRadialGradient(bx, by, 0, bx, by, bl.r);
        gr.addColorStop(0, `rgba(${bl.c},${ba})`);
        gr.addColorStop(1, `rgba(${bl.c},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      }

      // Spawn new particles as needed
      while (particles.length < currentCount) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          sz: 0, // starts at 0, grows
          targetSz: 0.4 + Math.random() * 1.2,
          birth: frame,
          ph: Math.random() * 6.28,
          sp: 0.002 + Math.random() * 0.003,
          gold: Math.random() < 0.5,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.1,
        });
      }

      // Render particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        const age = frame - p.birth;
        const scale = Math.min(1, age / 20); // grow over 20 frames
        p.sz = p.targetSz * scale;
        const gl = Math.pow(Math.max(0, Math.sin(frame * p.sp + p.ph)), 3);
        const col = p.gold ? `rgba(201,169,110,${0.1 + gl * 0.6})` : `rgba(200,195,220,${0.08 + gl * 0.4})`;
        ctx.globalAlpha = (0.1 + gl * 0.55) * scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz * (0.3 + gl * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Name faded up
      const nameY = cy - h * 0.25;
      ctx.font = '300 2rem "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,255,${0.7 - progress * 0.3})`;
      ctx.fillText(name, cx, nameY);
    }
    // Phase 4: Text overlay fade-in (frames 270-330)
    else if (frame <= 330) {
      const progress = (frame - 270) / 60;

      // Full background + blobs + particles
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      for (const bl of blobs) {
        const bx = bl.x * (w / 400) + Math.sin(frame * 0.004 + bl.ph) * 30;
        const by = bl.y * (h / 600) + Math.cos(frame * 0.003 + bl.ph) * 20;
        const ba = bl.a * (0.5 + 0.5 * Math.sin(frame * 0.01 + bl.ph));
        const gr = ctx.createRadialGradient(bx, by, 0, bx, by, bl.r);
        gr.addColorStop(0, `rgba(${bl.c},${ba})`);
        gr.addColorStop(1, `rgba(${bl.c},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      }
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        const gl = Math.pow(Math.max(0, Math.sin(frame * p.sp + p.ph)), 3);
        const col = p.gold ? `rgba(201,169,110,${0.1 + gl * 0.6})` : `rgba(200,195,220,${0.08 + gl * 0.4})`;
        ctx.globalAlpha = 0.1 + gl * 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz * (0.3 + gl * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Staggered text elements
      const lines = [
        { text: 'SAVE THE DATE', y: cy - 60, font: '500 0.5rem "DM Sans", sans-serif', delay: 0, spacing: '3px', alpha: 0.5 },
        { text: name, y: cy - 20, font: '300 1.5rem "Cormorant Garamond", serif', delay: 0.15, spacing: '2px', alpha: 1 },
        { text: 'September 14, 2026', y: cy + 25, font: '400 0.55rem "DM Sans", sans-serif', delay: 0.3, spacing: '2.5px', alpha: 0.4 },
        { text: 'The Garden Estate', y: cy + 45, font: '300 italic 0.7rem "Cormorant Garamond", serif', delay: 0.45, spacing: '1px', alpha: 0.3 },
      ];
      for (const line of lines) {
        const lineProgress = Math.max(0, Math.min(1, (progress - line.delay) / 0.4));
        if (lineProgress <= 0) continue;
        const eased = 1 - Math.pow(1 - lineProgress, 2);
        ctx.font = line.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = line.spacing;
        ctx.fillStyle = `rgba(232,224,208,${line.alpha * eased})`;
        ctx.fillText(line.text, cx, line.y + (1 - eased) * 10);
      }
    }
    // Phase 5: Steady state (loop)
    else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      for (const bl of blobs) {
        const bx = bl.x * (w / 400) + Math.sin(frame * 0.004 + bl.ph) * 30;
        const by = bl.y * (h / 600) + Math.cos(frame * 0.003 + bl.ph) * 20;
        const ba = bl.a * (0.5 + 0.5 * Math.sin(frame * 0.01 + bl.ph));
        const gr = ctx.createRadialGradient(bx, by, 0, bx, by, bl.r);
        gr.addColorStop(0, `rgba(${bl.c},${ba})`);
        gr.addColorStop(1, `rgba(${bl.c},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      }
      for (const p of particles) {
        p.x += p.vx + Math.sin(frame * 0.004 + p.ph) * 0.3;
        p.y += p.vy;
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;
        const gl = Math.pow(Math.max(0, Math.sin(frame * p.sp + p.ph)), 3);
        const col = p.gold ? `rgba(201,169,110,${0.1 + gl * 0.6})` : `rgba(200,195,220,${0.08 + gl * 0.4})`;
        ctx.globalAlpha = 0.1 + gl * 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz * (0.3 + gl * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Steady overlay text
      ctx.font = '500 0.5rem "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(201,169,110,0.5)';
      ctx.letterSpacing = '3px';
      ctx.fillText('SAVE THE DATE', cx, cy - 60);

      ctx.font = '300 1.5rem "Cormorant Garamond", serif';
      ctx.fillStyle = 'rgba(232,224,208,1)';
      ctx.letterSpacing = '2px';
      ctx.fillText(name, cx, cy - 20);

      ctx.font = '400 0.55rem "DM Sans", sans-serif';
      ctx.fillStyle = 'rgba(232,224,208,0.4)';
      ctx.letterSpacing = '2.5px';
      ctx.fillText('September 14, 2026', cx, cy + 25);

      ctx.font = '300 italic 0.7rem "Cormorant Garamond", serif';
      ctx.fillStyle = 'rgba(232,224,208,0.3)';
      ctx.letterSpacing = '1px';
      ctx.fillText('The Garden Estate', cx, cy + 45);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
  window.addEventListener('resize', resize);

  return {
    stop() {
      stopped = true;
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}

// ─── Analytics ───────────────────────────────────────────────────────────────

const ANALYTICS_KEY = 'livecard_nfc_analytics';

export function logTap(cardId, source = 'link') {
  try {
    const entries = JSON.parse(sessionStorage.getItem(ANALYTICS_KEY) || '[]');
    entries.push({
      cardId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      source,
    });
    sessionStorage.setItem(ANALYTICS_KEY, JSON.stringify(entries));
  } catch (_) {}
}

export function generateCardURL(cardId) {
  return `https://livecardstudio.com/c/${cardId}`;
}

// ─── Demo Panel ──────────────────────────────────────────────────────────────

export function createNFCBridgeDemo(container) {
  let wrap = null;
  let sequence = null;
  let overlay = null;

  return {
    init(containerEl) {
      if (!containerEl) return;
      wrap = document.createElement('div');
      wrap.className = 'codex-demo-wrap nfc-demo';

      // Generate a demo URL and QR
      const demoId = 'lcs_demo2026';
      const demoURL = generateCardURL(demoId);
      const qrCanvas = generateStyledQR(demoURL, { primary: '#2A2520', bg: '#FDFBF7' }, 200);

      wrap.innerHTML = `
        <div class="nfc-demo-split">
          <div class="nfc-physical-card">
            <div class="nfc-card-inner">
              <div class="nfc-card-foil"></div>
              <div class="nfc-card-content">
                <div class="nfc-card-mono">SAVE THE DATE</div>
                <div class="nfc-card-names">Olivia & James</div>
                <div class="nfc-card-date">September 14, 2026</div>
                <div class="nfc-card-nfc-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 12a6 6 0 0 1 12 0"/><path d="M3 12a9 9 0 0 1 18 0"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
                  <span>NFC</span>
                </div>
              </div>
            </div>
          </div>
          <div class="nfc-qr-side">
            <div class="nfc-qr-holder"></div>
            <p class="nfc-qr-url">${demoURL}</p>
            <button type="button" class="nfc-preview-btn">Tap to Preview</button>
          </div>
        </div>
      `;

      containerEl.appendChild(wrap);

      // Insert QR canvas
      const qrHolder = wrap.querySelector('.nfc-qr-holder');
      qrCanvas.style.cssText = 'width:100%;max-width:180px;height:auto;border-radius:12px;';
      qrHolder.appendChild(qrCanvas);

      // Preview button — launches immersive load sequence
      wrap.querySelector('.nfc-preview-btn').addEventListener('click', () => {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.className = 'nfc-load-overlay';
        overlay.innerHTML = '<div class="nfc-load-container"></div><button type="button" class="nfc-load-close" aria-label="Close">&times;</button>';
        document.body.appendChild(overlay);

        const loadContainer = overlay.querySelector('.nfc-load-container');
        sequence = playLoadSequence(loadContainer, {
          recipientName: 'Olivia & James',
          bg: '#1C1926',
          blobs: ['55,40,95', '95,70,135', '130,100,55'],
          particleCount: 30,
        });

        overlay.querySelector('.nfc-load-close').addEventListener('click', closeOverlay);
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) closeOverlay();
        });

        logTap(demoId, 'demo');
      });

      function closeOverlay() {
        if (sequence) { sequence.stop(); sequence = null; }
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
      }
    },
    destroy() {
      if (sequence) { sequence.stop(); sequence = null; }
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      wrap = null;
    }
  };
}
