import { Occasion, Theme, MusicStyle } from '@prisma/client';
import { CardFeatures, defaultCardFeatures } from '@/types/card';

type InputPhoto = {
  src: string;
  caption?: string | null;
};

type GiftData = {
  brand: string;
  amountCents: number;
  redemptionUrl?: string | null;
};

export type CardGenerationInput = {
  slug: string;
  recipientName: string;
  senderName?: string | null;
  title: string;
  occasion: Occasion;
  theme: Theme;
  message: string;
  sectionMessages?: string[];
  musicStyle: MusicStyle;
  photos: InputPhoto[];
  features?: Partial<CardFeatures>;
  gift?: GiftData | null;
};

type ThemeTokens = {
  bgA: string;
  bgB: string;
  bgC: string;
  text: string;
  accent: string;
  accentSoft: string;
  card: string;
  border: string;
};

const THEMES: Record<Theme, ThemeTokens> = {
  WATERCOLOR: {
    bgA: '#fdf8f0',
    bgB: '#f8efe3',
    bgC: '#f2e6db',
    text: '#3a2f2a',
    accent: '#c87941',
    accentSoft: '#d4a574',
    card: '#fff9f2',
    border: 'rgba(200,160,120,0.26)'
  },
  CELESTIAL: {
    bgA: '#141427',
    bgB: '#1f233d',
    bgC: '#2d3152',
    text: '#f2e9ff',
    accent: '#d4a574',
    accentSoft: '#c4b0d4',
    card: '#242743',
    border: 'rgba(196,176,212,0.35)'
  },
  MODERN_MINIMAL: {
    bgA: '#f8f7f5',
    bgB: '#f3f1ed',
    bgC: '#e9e5de',
    text: '#2d2926',
    accent: '#b8865d',
    accentSoft: '#d4b99d',
    card: '#ffffff',
    border: 'rgba(110,90,70,0.22)'
  },
  BOTANICAL: {
    bgA: '#eef6eb',
    bgB: '#e3f0df',
    bgC: '#d7e8d2',
    text: '#2f3b2f',
    accent: '#66875f',
    accentSoft: '#9fbe8f',
    card: '#f7fbf4',
    border: 'rgba(102,135,95,0.26)'
  },
  VINTAGE_FILM: {
    bgA: '#f4eee3',
    bgB: '#e9dcc8',
    bgC: '#d9c4a8',
    text: '#46382c',
    accent: '#a26b49',
    accentSoft: '#c9a27b',
    card: '#fbf6ee',
    border: 'rgba(140,104,77,0.28)'
  },
  GOLDEN_HOUR: {
    bgA: '#fff4de',
    bgB: '#f7e0b7',
    bgC: '#efcc8a',
    text: '#4e3a24',
    accent: '#d08a32',
    accentSoft: '#edbe72',
    card: '#fff9ef',
    border: 'rgba(208,138,50,0.32)'
  },
  MIDNIGHT_GARDEN: {
    bgA: '#11111f',
    bgB: '#1d1f31',
    bgC: '#2a2f40',
    text: '#f5f1f8',
    accent: '#9ecb77',
    accentSoft: '#d3e8b7',
    card: '#222536',
    border: 'rgba(158,203,119,0.35)'
  },
  PASTEL_DREAM: {
    bgA: '#fdf1f6',
    bgB: '#f5edf8',
    bgC: '#eaf2fb',
    text: '#443548',
    accent: '#b082b8',
    accentSoft: '#d4b8dc',
    card: '#fff8fd',
    border: 'rgba(176,130,184,0.28)'
  }
};

const OCCASION_COPY: Record<Occasion, string> = {
  BIRTHDAY: 'Happy Birthday',
  WEDDING: 'For Your Wedding Day',
  ANNIVERSARY: 'Happy Anniversary',
  BABY_SHOWER: 'Celebrating New Life',
  GRADUATION: 'A Beautiful Milestone',
  VALENTINES: 'With Love',
  MOTHERS_DAY: 'For Mom',
  FATHERS_DAY: 'For Dad',
  HOLIDAY: 'Seasonal Wishes',
  THANK_YOU: 'With Gratitude',
  JUST_BECAUSE: 'Just Because',
  SYMPATHY: 'Holding You Close',
  CONGRATULATIONS: 'Congratulations'
};

function esc(value: string | null | undefined) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toHtmlLines(value: string) {
  return esc(value).replace(/\n/g, '<br>');
}

function normalizeFeatures(features?: Partial<CardFeatures>): CardFeatures {
  return {
    ...defaultCardFeatures,
    ...(features || {})
  };
}

function sectionCopy(input: CardGenerationInput) {
  if (input.sectionMessages?.length) {
    return input.sectionMessages;
  }

  return [
    `Every frame here is a memory crafted for ${input.recipientName}.`,
    `A few moments that remind us how deeply you are loved.`,
    `Keep scrolling. The best part is still ahead.`
  ];
}

function photoCards(input: CardGenerationInput) {
  const sectionMessages = sectionCopy(input);

  return input.photos
    .map((photo, idx) => {
      const sectionLine = sectionMessages[idx % sectionMessages.length];

      return `
        <article class="photo-card ${idx % 2 ? 'offset' : ''}" data-tilt>
          <div class="photo-shell">
            <img src="${photo.src}" alt="Memory ${idx + 1} for ${esc(input.recipientName)}" loading="lazy" />
          </div>
          <p class="section-copy">${toHtmlLines(sectionLine)}</p>
          ${photo.caption ? `<p class="caption">${esc(photo.caption)}</p>` : ''}
        </article>
      `;
    })
    .join('');
}

function giftMarkup(gift: GiftData | null | undefined, recipientName: string) {
  if (!gift) {
    return '';
  }

  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(gift.amountCents / 100);

  return `
    <section id="giftReveal" class="gift-wrap">
      <p class="gift-kicker">A little something extra</p>
      <button id="giftOpen" class="gift-envelope" type="button">Tap to open your gift</button>
      <div id="giftCard" class="gift-card" aria-hidden="true">
        <p class="gift-brand">${esc(gift.brand)}</p>
        <p class="gift-amount">${esc(amount)}</p>
        <p class="gift-note">A little something extra for you, ${esc(recipientName)}.</p>
        ${
          gift.redemptionUrl
            ? `<a href="${esc(gift.redemptionUrl)}" class="gift-redeem" target="_blank" rel="noopener">Redeem your gift</a>`
            : '<button class="gift-redeem" disabled>Gift unlocks after delivery</button>'
        }
      </div>
    </section>
  `;
}

function soundScript(musicStyle: MusicStyle) {
  const style = JSON.stringify(musicStyle);

  return `
    <script>
      (function(){
        const style = ${style};
        let ctx;
        let playing = false;
        let interval;
        const notesByStyle = {
          MUSIC_BOX_BIRTHDAY: [523, 659, 784, 659, 880, 784, 659, 523],
          AMBIENT_WARM: [220, 262, 294, 330],
          GENTLE_PIANO: [261, 329, 392, 523],
          CELESTIAL_PADS: [196, 247, 294, 392],
          SOFT_GUITAR: [196, 247, 330, 392],
          NONE: []
        };

        function start(){
          if (style === 'NONE' || playing) return;
          if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
          const notes = notesByStyle[style] || notesByStyle.MUSIC_BOX_BIRTHDAY;
          if (!notes.length) return;
          playing = true;
          let step = 0;
          interval = setInterval(() => {
            const freq = notes[step % notes.length];
            step += 1;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = style === 'AMBIENT_WARM' ? 'triangle' : 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.62);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.66);
          }, 520);
        }

        function stop(){
          if (interval) clearInterval(interval);
          interval = null;
          playing = false;
        }

        const playButton = document.getElementById('soundPlay');
        const closeButton = document.getElementById('soundClose');
        if (playButton) playButton.addEventListener('click', () => { start(); playButton.textContent = 'Playing'; });
        if (closeButton) closeButton.addEventListener('click', () => { const b = document.getElementById('soundBanner'); if (b) b.remove(); stop(); });
      })();
    </script>
  `;
}

function interactionScript(features: CardFeatures) {
  return `
    <script>
      (function(){
        const features = ${JSON.stringify(features)};
        if (features.photoInteractions) {
          const cards = Array.from(document.querySelectorAll('[data-tilt]'));
          cards.forEach((card) => {
            card.addEventListener('pointermove', (event) => {
              const rect = card.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              card.style.transform = 'perspective(900px) rotateX(' + (-y * 8).toFixed(2) + 'deg) rotateY(' + (x * 10).toFixed(2) + 'deg)';
            });
            card.addEventListener('pointerleave', () => {
              card.style.transform = '';
            });
          });
        }

        if (features.brushReveal) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
              }
            });
          }, { threshold: 0.28 });
          document.querySelectorAll('.photo-card').forEach((el) => observer.observe(el));
        }

        if (features.paintCanvas) {
          const canvas = document.getElementById('paintCanvas');
          const fab = document.getElementById('paintFab');
          const prompt = document.getElementById('paintPrompt');
          if (canvas && fab) {
            const ctx = canvas.getContext('2d');
            let drawing = false;
            let enabled = false;

            function resize() {
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;
            }
            resize();
            window.addEventListener('resize', resize);

            function draw(x, y) {
              if (!ctx) return;
              ctx.fillStyle = 'rgba(200, 121, 65, 0.2)';
              ctx.beginPath();
              ctx.arc(x, y, 14, 0, Math.PI * 2);
              ctx.fill();
            }

            fab.addEventListener('click', () => {
              enabled = !enabled;
              fab.textContent = enabled ? 'Painting On' : 'Paint';
              if (prompt) prompt.remove();
            });

            canvas.addEventListener('pointerdown', (e) => {
              if (!enabled) return;
              drawing = true;
              draw(e.clientX, e.clientY);
            });
            canvas.addEventListener('pointermove', (e) => {
              if (!enabled || !drawing) return;
              draw(e.clientX, e.clientY);
            });
            window.addEventListener('pointerup', () => {
              drawing = false;
            });

            setTimeout(() => {
              if (prompt) prompt.classList.add('show');
            }, 3000);
          }
        } else {
          const c = document.getElementById('paintCanvas');
          const f = document.getElementById('paintFab');
          const p = document.getElementById('paintPrompt');
          if (c) c.remove();
          if (f) f.remove();
          if (p) p.remove();
        }

        if (features.confettiFinale) {
          const trigger = document.getElementById('finale');
          if (trigger) {
            const observer = new IntersectionObserver((entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  for (let i = 0; i < 80; i++) {
                    const conf = document.createElement('i');
                    conf.className = 'confetti';
                    conf.style.left = Math.random() * 100 + 'vw';
                    conf.style.animationDelay = (Math.random() * 0.7).toFixed(2) + 's';
                    conf.style.background = i % 3 === 0 ? '#c87941' : i % 3 === 1 ? '#d4a574' : '#c4b0d4';
                    document.body.appendChild(conf);
                    setTimeout(() => conf.remove(), 2200);
                  }
                  observer.disconnect();
                }
              });
            }, { threshold: 0.7 });
            observer.observe(trigger);
          }
        }

        const giftOpen = document.getElementById('giftOpen');
        const giftCard = document.getElementById('giftCard');
        if (giftOpen && giftCard) {
          giftOpen.addEventListener('click', () => {
            giftCard.classList.add('open');
            giftCard.setAttribute('aria-hidden', 'false');
            giftOpen.remove();
          });
        }

        const finaleMessage = document.getElementById('finaleText');
        if (finaleMessage) {
          const content = finaleMessage.getAttribute('data-message') || '';
          let idx = 0;
          finaleMessage.textContent = '';
          const cursor = document.createElement('span');
          cursor.className = 'cursor';
          finaleMessage.appendChild(cursor);

          function step() {
            if (idx >= content.length) {
              cursor.remove();
              return;
            }
            const ch = content[idx++];
            if (ch === '\n') {
              cursor.insertAdjacentHTML('beforebegin', '<br>');
            } else {
              cursor.insertAdjacentText('beforebegin', ch);
            }
            setTimeout(step, /[,.!?]/.test(ch) ? 70 : 23);
          }

          setTimeout(step, 360);
        }
      })();
    </script>
  `;
}

export function generateCardHtml(input: CardGenerationInput) {
  const theme = THEMES[input.theme] || THEMES.WATERCOLOR;
  const featureToggles = normalizeFeatures(input.features);
  const greeting = OCCASION_COPY[input.occasion] || 'A Living Card';
  const sender = input.senderName || 'With love';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(greeting)} for ${esc(input.recipientName)}</title>
<style>
  :root {
    --bg-a: ${theme.bgA};
    --bg-b: ${theme.bgB};
    --bg-c: ${theme.bgC};
    --text: ${theme.text};
    --accent: ${theme.accent};
    --accent-soft: ${theme.accentSoft};
    --card: ${theme.card};
    --border: ${theme.border};
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    min-height: 100vh;
    font-family: Georgia, 'Times New Roman', serif;
    color: var(--text);
    background:
      radial-gradient(circle at 16% 12%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 38%),
      radial-gradient(circle at 82% 72%, color-mix(in oklab, var(--accent-soft) 30%, transparent), transparent 40%),
      linear-gradient(160deg, var(--bg-a), var(--bg-b), var(--bg-c));
    overflow-x: hidden;
  }

  .shell {
    width: min(920px, 92vw);
    margin: 0 auto;
    padding: 30px 0 64px;
  }

  .sound-banner {
    position: sticky;
    top: 10px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 10px 14px;
    background: color-mix(in oklab, var(--card) 92%, transparent);
    backdrop-filter: blur(8px);
    font-size: 14px;
  }

  .sound-banner button {
    border: none;
    border-radius: 999px;
    padding: 7px 14px;
    background: var(--accent);
    color: #fff;
    font: 600 12px/1 system-ui, sans-serif;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .hero {
    text-align: center;
    padding: 72px 24px 42px;
  }

  .kicker {
    margin: 0;
    font: 600 11px/1.2 system-ui, sans-serif;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  .title {
    margin: 16px 0 10px;
    font-size: clamp(44px, 8vw, 82px);
    font-style: italic;
    line-height: 0.95;
    color: var(--accent);
  }

  .recipient {
    margin: 0;
    font-size: clamp(28px, 4.5vw, 42px);
    line-height: 1.1;
  }

  .subtitle {
    margin: 16px auto 0;
    max-width: 560px;
    font-size: clamp(18px, 2.2vw, 23px);
    line-height: 1.45;
    opacity: 0.9;
  }

  .gallery {
    display: grid;
    gap: 24px;
    margin-top: 18px;
  }

  .photo-card {
    opacity: ${featureToggles.brushReveal ? '0.2' : '1'};
    transform: ${featureToggles.brushReveal ? 'translateY(24px)' : 'none'};
    transition: transform 0.8s cubic-bezier(.23, 1, .32, 1), opacity 0.8s;
    border: 1px solid var(--border);
    border-radius: 18px;
    background: color-mix(in oklab, var(--card) 92%, transparent);
    padding: 14px;
  }

  .photo-card.revealed {
    opacity: 1;
    transform: translateY(0);
  }

  .photo-card.offset {
    margin-left: clamp(0px, 8vw, 60px);
  }

  .photo-shell {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid color-mix(in oklab, var(--border) 90%, transparent);
    box-shadow: 0 10px 30px rgba(40, 20, 10, 0.12);
  }

  .photo-shell img {
    display: block;
    width: 100%;
    height: auto;
  }

  .section-copy {
    margin: 12px 4px 0;
    font-size: 22px;
    line-height: 1.35;
  }

  .caption {
    margin: 8px 4px 0;
    font: 500 13px/1.5 system-ui, sans-serif;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.68;
  }

  .finale {
    margin: 54px 0 30px;
    border: 1px solid var(--border);
    border-radius: 22px;
    background: color-mix(in oklab, var(--card) 93%, transparent);
    padding: 30px 24px;
    text-align: center;
  }

  .finale h2 {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-family: system-ui, sans-serif;
    opacity: 0.72;
  }

  .finale-message {
    margin-top: 18px;
    font-size: clamp(24px, 3.1vw, 34px);
    line-height: 1.5;
    min-height: 120px;
  }

  .signature {
    margin-top: 24px;
    font-size: 40px;
    font-family: 'Brush Script MT', cursive;
    color: var(--accent);
  }

  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    vertical-align: bottom;
    background: var(--accent);
    animation: blink 1s steps(1, end) infinite;
  }

  @keyframes blink { 50% { opacity: 0; } }

  .gift-wrap {
    margin: 34px 0;
    text-align: center;
    border: 1px solid var(--border);
    background: color-mix(in oklab, var(--card) 92%, transparent);
    border-radius: 18px;
    padding: 24px;
  }

  .gift-kicker {
    margin: 0;
    font: 600 11px/1.2 system-ui, sans-serif;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  .gift-envelope {
    margin-top: 16px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: #fff;
    color: var(--text);
    font: 600 13px/1 system-ui, sans-serif;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 12px 22px;
    cursor: pointer;
  }

  .gift-card {
    margin: 18px auto 0;
    max-width: 360px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: color-mix(in oklab, var(--accent-soft) 16%, #fff);
    padding: 16px;
    opacity: 0;
    transform: translateY(18px) scale(0.98);
    transition: all 0.55s cubic-bezier(.23, 1, .32, 1);
  }

  .gift-card.open {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .gift-brand {
    margin: 0;
    font-size: 24px;
  }

  .gift-amount {
    margin: 8px 0 0;
    font: 700 28px/1.1 system-ui, sans-serif;
  }

  .gift-note {
    margin: 8px 0 0;
    font-size: 18px;
  }

  .gift-redeem {
    display: inline-flex;
    margin-top: 14px;
    border: none;
    border-radius: 999px;
    padding: 10px 18px;
    background: var(--accent);
    color: #fff;
    font: 600 12px/1 system-ui, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-decoration: none;
  }

  .gift-redeem:disabled {
    opacity: 0.6;
  }

  .footer-brand {
    margin-top: 28px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
    text-align: center;
  }

  .footer-brand small {
    display: block;
    font: 600 11px/1.2 system-ui, sans-serif;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.66;
  }

  .footer-brand a {
    display: inline-block;
    margin: 8px 0;
    font-size: 22px;
    color: var(--accent);
    text-decoration: none;
  }

  .paint-fab {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 30;
    border: none;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    padding: 12px 16px;
    font: 600 12px/1 system-ui, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 14px 24px rgba(60, 35, 20, 0.2);
  }

  .paint-canvas {
    position: fixed;
    inset: 0;
    z-index: 8;
    pointer-events: auto;
  }

  .paint-prompt {
    position: fixed;
    left: 50%;
    bottom: 84px;
    transform: translateX(-50%) translateY(10px);
    opacity: 0;
    transition: all 0.4s;
    z-index: 28;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: color-mix(in oklab, var(--card) 90%, transparent);
    padding: 10px 14px;
    font: 600 11px/1.2 system-ui, sans-serif;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .paint-prompt.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .confetti {
    position: fixed;
    top: -18px;
    width: 8px;
    height: 16px;
    border-radius: 2px;
    z-index: 40;
    animation: confettiDrop 2s ease-in forwards;
  }

  @keyframes confettiDrop {
    to {
      transform: translateY(108vh) rotate(420deg);
      opacity: 0;
    }
  }

  @media (max-width: 680px) {
    .hero { padding-top: 48px; }
    .photo-card.offset { margin-left: 0; }
    .section-copy { font-size: 20px; }
  }
</style>
</head>
<body>
  <canvas id="paintCanvas" class="paint-canvas"></canvas>
  <button id="paintFab" class="paint-fab" type="button">Paint</button>
  <div id="paintPrompt" class="paint-prompt">This card is yours, ${esc(input.recipientName)}. Tap Paint to watercolor it.</div>

  <div class="shell">
    <div class="sound-banner" id="soundBanner">
      <span>This card sings for you, ${esc(input.recipientName)}. Tap play to hear it.</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="soundPlay" type="button">Play</button>
        <button id="soundClose" type="button" style="background:transparent;color:var(--text);border:1px solid var(--border);">X</button>
      </div>
    </div>

    <header class="hero">
      <p class="kicker">Living card for the moments that matter</p>
      <h1 class="title">${esc(greeting)}</h1>
      <p class="recipient">${esc(input.recipientName)}</p>
      <p class="subtitle">Every scroll is a memory, every detail crafted by hand just for you.</p>
    </header>

    <main class="gallery">
      ${photoCards(input)}
    </main>

    <section id="finale" class="finale">
      <h2>A note from the heart</h2>
      <p id="finaleText" class="finale-message" data-message="${esc(input.message)}"></p>
      <p class="signature">${esc(sender)}</p>
    </section>

    ${giftMarkup(input.gift, input.recipientName)}

    <footer class="footer-brand">
      <small>crafted with love on</small>
      <a href="https://livecardstudio.com" target="_blank" rel="noopener">LiveCardStudio.com</a>
      <small>living cards for the moments that matter</small>
    </footer>
  </div>

  ${soundScript(input.musicStyle)}
  ${interactionScript(featureToggles)}
</body>
</html>`;
}
