import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Occasion, QuickTheme } from '@prisma/client';
import { getDefaultQuickTheme } from '@/types/card';

type PhotoInput = {
  src: string;
  caption?: string | null;
  slotType?: 'PHOTO' | 'TEXT_PANEL';
  textContent?: string | null;
};

type GiftInput = {
  brand: string;
  amountCents: number;
  redemptionUrl?: string | null;
};

type CustomAudioInput = {
  url: string;
  name?: string | null;
  mimeType?: string | null;
};

export type QuickThemeRenderInput = {
  slug: string;
  recipientName: string;
  senderName?: string | null;
  occasion: Occasion;
  quickTheme?: QuickTheme;
  message: string;
  photos: PhotoInput[];
  customAudio?: CustomAudioInput;
  gift?: GiftInput | null;
};

const QUICK_THEME_TEMPLATE_FILES: Record<QuickTheme, string> = {
  AURORA_DREAMS: 'v2-aurora-dreams.html',
  DEEP_BIOLUMINESCENCE: 'v2-deep-bioluminescence.html',
  FIREFLY_MEADOW: 'v2-firefly-meadow.html',
  LANTERN_FESTIVAL: 'v2-lantern-festival.html',
  MIDNIGHT_RAIN: 'v2-midnight-rain.html',
  SAKURA_WIND: 'v2-sakura-wind.html',
  FIRST_DANCE: 'v2-first-dance.html',
  CHAMPAGNE_TOAST: 'v2-champagne-toast.html',
  RINGS_OF_LIGHT: 'v2-rings-of-light.html'
};

const OCCASION_COPY: Record<Occasion, string> = {
  BIRTHDAY: 'Happy Birthday',
  WEDDING: 'For Your Wedding Day',
  ENGAGEMENT: 'For Your Engagement',
  ANNIVERSARY: 'Happy Anniversary',
  BABY_SHOWER: 'Celebrating New Life',
  GRADUATION: 'A Beautiful Milestone',
  VALENTINES: 'With Love',
  MOTHERS_DAY: 'For Mom',
  FATHERS_DAY: 'For Dad',
  HOLIDAY: 'Seasonal Wishes',
  NEW_YEARS: 'Happy New Year',
  THANK_YOU: 'With Gratitude',
  JUST_BECAUSE: 'Just Because',
  SYMPATHY: 'Holding You Close',
  CONGRATULATIONS: 'Congratulations',
  PROMOTION: 'Congratulations On Your Promotion'
};

const QUICK_GIFT_STYLE = `
.lcs-gift-wrap {
  position: fixed;
  left: 50%;
  bottom: 5rem;
  transform: translateX(-50%);
  z-index: 24;
  width: min(92vw, 360px);
  text-align: center;
}

.lcs-gift-open {
  border: 1px solid rgba(255,255,255,0.32);
  border-radius: 999px;
  background: rgba(0,0,0,0.35);
  color: #fff;
  font: 600 11px/1.1 system-ui, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 10px 16px;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.lcs-gift-card {
  margin-top: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.26);
  background: rgba(0,0,0,0.42);
  color: #fff;
  backdrop-filter: blur(14px);
  padding: 14px;
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.lcs-gift-card.open {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.lcs-gift-brand {
  margin: 0;
  font: 500 22px/1.2 'Cormorant Garamond', serif;
}

.lcs-gift-amount {
  margin: 6px 0 0;
  font: 700 26px/1.1 system-ui, sans-serif;
}

.lcs-gift-note {
  margin: 7px 0 0;
  font: 400 14px/1.35 system-ui, sans-serif;
}

.lcs-gift-redeem {
  display: inline-flex;
  margin-top: 10px;
  border: 1px solid rgba(255,255,255,0.32);
  border-radius: 999px;
  padding: 8px 14px;
  color: #fff;
  text-decoration: none;
  font: 600 11px/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.12);
}

.lcs-gift-redeem[aria-disabled='true'] {
  opacity: 0.6;
  pointer-events: none;
}
`;

const QUICK_AUDIO_STYLE = `
.lcs-audio-wrap {
  position: fixed;
  left: 50%;
  top: 14px;
  transform: translateX(-50%);
  z-index: 26;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 999px;
  background: rgba(0,0,0,0.38);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  color: #fff;
  font: 600 11px/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.lcs-audio-btn {
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 999px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font: 600 10px/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 10px;
  cursor: pointer;
}

.lcs-audio-name {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;

const templateCache = new Map<string, string>();

function escapeHtml(value: string | null | undefined) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function getTemplateForTheme(theme: QuickTheme) {
  const fileName = QUICK_THEME_TEMPLATE_FILES[theme];
  if (!fileName) {
    throw new Error(`Missing template mapping for quick theme: ${theme}`);
  }

  const cached = templateCache.get(fileName);
  if (cached) {
    return cached;
  }

  const filePath = path.join(process.cwd(), 'themes', fileName);
  const html = readFileSync(filePath, 'utf8');
  templateCache.set(fileName, html);
  return html;
}

function formatUsd(amountCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amountCents / 100);
}

function buildGiftMarkup(gift: GiftInput | null | undefined, recipientName: string) {
  if (!gift) {
    return '';
  }

  const amount = formatUsd(gift.amountCents);
  const redeemMarkup = gift.redemptionUrl
    ? `<a class="lcs-gift-redeem" href="${escapeHtml(gift.redemptionUrl)}" target="_blank" rel="noopener">Redeem gift</a>`
    : '<span class="lcs-gift-redeem" aria-disabled="true">Gift unlocks soon</span>';

  return `
<div class="lcs-gift-wrap" id="lcs-gift-wrap">
  <button class="lcs-gift-open" id="lcs-gift-open" type="button">Open your gift</button>
  <div class="lcs-gift-card" id="lcs-gift-card" aria-hidden="true">
    <p class="lcs-gift-brand">${escapeHtml(gift.brand)}</p>
    <p class="lcs-gift-amount">${escapeHtml(amount)}</p>
    <p class="lcs-gift-note">A little something extra for you, ${escapeHtml(recipientName)}.</p>
    ${redeemMarkup}
  </div>
</div>`;
}

function buildAudioMarkup(customAudio: CustomAudioInput | null | undefined) {
  if (!customAudio?.url) {
    return '';
  }

  return `
<div class="lcs-audio-wrap" id="lcs-audio-wrap">
  <span class="lcs-audio-name">${escapeHtml(customAudio.name || 'Custom Audio')}</span>
  <button class="lcs-audio-btn" id="lcs-audio-play" type="button">Play</button>
  <button class="lcs-audio-btn" id="lcs-audio-mute" type="button">Mute</button>
  <audio id="lcs-audio-el" src="${escapeHtml(customAudio.url)}" preload="auto" loop></audio>
</div>`;
}

function runtimePatchScript(data: {
  recipientName: string;
  occasionLabel: string;
  message: string;
  signature: string;
  photoSrc: string;
  isTextPanel?: boolean;
  textPanelContent?: string;
  customAudioUrl?: string;
  customAudioName?: string;
}) {
  const payload = escapeJsonForScript(data);

  return `<script>
(function () {
  var data = ${payload};

  function setText(selector, value, signatureMode) {
    var node = document.querySelector(selector);
    if (!node || !value) {
      return;
    }

    var text = String(value);
    if (signatureMode) {
      var trimmed = text.trim();
      text = trimmed.startsWith('-') ? trimmed : '- ' + trimmed;
    }

    node.textContent = text;
  }

  var compactMessage = String(data.message || '').replace(/\s+/g, ' ').trim();
  var shortMessage = compactMessage.slice(0, 90);
  var weddingNames = String(data.signature || '').trim()
    ? data.recipientName + ' & ' + String(data.signature || '').trim()
    : data.recipientName;

  setText('.msg-occ', data.occasionLabel, false);
  setText('.msg-txt', data.message, false);
  setText('.msg-from', data.signature, true);
  setText('.card-title', data.occasionLabel, false);
  setText('.card-sub', shortMessage || data.occasionLabel, false);
  setText('.card-names', weddingNames, false);

  var msgText = document.querySelector('.msg-txt');
  if (msgText) {
    msgText.style.whiteSpace = 'pre-line';
  }

  document.title = data.occasionLabel + ' for ' + data.recipientName;

  var brandLink = document.querySelector('.branding a');
  if (brandLink) {
    brandLink.setAttribute('href', 'https://livecardstudio.com');
    brandLink.setAttribute('target', '_blank');
    brandLink.setAttribute('rel', 'noopener');
  }

  var previousInit = typeof initP === 'function' ? initP : null;

  function drawCover(ctx, img, size) {
    var scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    var drawW = img.naturalWidth * scale;
    var drawH = img.naturalHeight * scale;
    var drawX = (size - drawW) / 2;
    var drawY = (size - drawH) / 2;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.filter = 'blur(16px) saturate(0.85)';
    ctx.globalAlpha = 0.45;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, size, size);

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  function renderTextPanel() {
    var frame = document.getElementById('pf');
    var canvas = document.getElementById('pc');
    if (!frame || !canvas) { return; }

    var size = frame.offsetWidth || 280;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    var grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, 'rgba(212,168,83,0.15)');
    grad.addColorStop(1, 'rgba(42,27,61,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    var text = String(data.textPanelContent || '');
    var fontSize = Math.max(14, Math.min(size / 14, 22));
    ctx.fillStyle = 'rgba(255,248,240,0.92)';
    ctx.font = 'italic ' + fontSize + 'px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var words = text.split(/\s+/);
    var lines = [];
    var currentLine = '';
    var maxWidth = size * 0.78;
    for (var w = 0; w < words.length; w++) {
      var test = currentLine ? currentLine + ' ' + words[w] : words[w];
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[w];
      } else {
        currentLine = test;
      }
    }
    if (currentLine) { lines.push(currentLine); }

    var lineHeight = fontSize * 1.6;
    var totalHeight = lines.length * lineHeight;
    var startY = (size - totalHeight) / 2 + fontSize / 2;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], size / 2, startY + i * lineHeight);
    }

    var filterLabel = document.getElementById('fl');
    if (filterLabel) { filterLabel.style.display = 'none'; }
    var tapHint = document.querySelector('.tap-hint');
    if (tapHint) { tapHint.style.display = 'none'; }
  }

  function renderPhoto() {
    if (data.isTextPanel) {
      renderTextPanel();
      return;
    }

    if (!data.photoSrc || typeof Image === 'undefined') {
      if (previousInit) {
        previousInit();
      }
      return;
    }

    var frame = document.getElementById('pf');
    var canvas = document.getElementById('pc');
    if (!frame || !canvas) {
      if (previousInit) {
        previousInit();
      }
      return;
    }

    var size = frame.offsetWidth || 280;
    canvas.width = size;
    canvas.height = size;

    var context = canvas.getContext('2d');
    if (!context) {
      if (previousInit) {
        previousInit();
      }
      return;
    }

    var img = new Image();
    img.onload = function () {
      drawCover(context, img, size);

      try {
        if (typeof oD !== 'undefined') {
          oD = context.getImageData(0, 0, size, size);
        }
      } catch (error) {
        // Keep showing the image even if browser blocks pixel reads.
      }

      if (typeof cf !== 'undefined') {
        cf = 0;
      }

      var filterLabel = document.getElementById('fl');
      if (filterLabel) {
        filterLabel.textContent = 'Original';
      }
    };

    img.onerror = function () {
      if (previousInit) {
        previousInit();
      }
    };

    img.src = data.photoSrc;
  }

  if (typeof initP === 'function') {
    initP = renderPhoto;
  }

  setTimeout(renderPhoto, 140);

  var giftOpen = document.getElementById('lcs-gift-open');
  var giftCard = document.getElementById('lcs-gift-card');
  if (giftOpen && giftCard) {
    giftOpen.addEventListener('click', function () {
      giftCard.classList.add('open');
      giftCard.setAttribute('aria-hidden', 'false');
      giftOpen.remove();
    });
  }

  var audioEl = document.getElementById('lcs-audio-el');
  var audioPlay = document.getElementById('lcs-audio-play');
  var audioMute = document.getElementById('lcs-audio-mute');
  if (audioEl && audioPlay && audioMute) {
    function syncAudioUi() {
      audioPlay.textContent = audioEl.paused ? 'Play' : 'Pause';
      audioMute.textContent = audioEl.muted ? 'Unmute' : 'Mute';
    }

    audioPlay.addEventListener('click', function () {
      if (audioEl.paused) {
        audioEl.play().then(syncAudioUi).catch(function () {
          audioPlay.textContent = 'Tap to play';
        });
      } else {
        audioEl.pause();
        syncAudioUi();
      }
    });

    audioMute.addEventListener('click', function () {
      audioEl.muted = !audioEl.muted;
      syncAudioUi();
    });

    audioEl.addEventListener('play', syncAudioUi);
    audioEl.addEventListener('pause', syncAudioUi);
    syncAudioUi();

    audioEl.play().then(syncAudioUi).catch(function () {
      audioPlay.textContent = 'Play';
    });
  }
})();
</script>`;
}

export function renderQuickThemeHtml(input: QuickThemeRenderInput) {
  const quickTheme = input.quickTheme || getDefaultQuickTheme(input.occasion);
  const themeTemplate = getTemplateForTheme(quickTheme);
  const occasionLabel = OCCASION_COPY[input.occasion] || 'A Living Card';
  const signature = (input.senderName || 'With love').trim();
  const firstItem = input.photos[0];
  const isTextPanel = firstItem?.slotType === 'TEXT_PANEL';
  const firstPhoto = isTextPanel ? '' : (firstItem?.src || '');

  let html = themeTemplate.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(`${occasionLabel} for ${input.recipientName}`)}</title>`
  );

  if (input.gift) {
    html = html.replace('</style>', `${QUICK_GIFT_STYLE}\n</style>`);
  }
  if (input.customAudio?.url) {
    html = html.replace('</style>', `${QUICK_AUDIO_STYLE}\n</style>`);
  }

  const giftMarkup = buildGiftMarkup(input.gift, input.recipientName);
  const audioMarkup = buildAudioMarkup(input.customAudio);
  if (audioMarkup) {
    html = html.replace('</body>', `${audioMarkup}\n</body>`);
  }
  if (giftMarkup) {
    html = html.replace('</body>', `${giftMarkup}\n</body>`);
  }

  const patchScript = runtimePatchScript({
    recipientName: input.recipientName,
    occasionLabel,
    message: input.message,
    signature,
    photoSrc: firstPhoto,
    isTextPanel,
    textPanelContent: isTextPanel ? (firstItem?.textContent || '') : '',
    customAudioUrl: input.customAudio?.url,
    customAudioName: input.customAudio?.name || undefined
  });

  html = html.replace('</body>', `${patchScript}\n</body>`);
  return html;
}
