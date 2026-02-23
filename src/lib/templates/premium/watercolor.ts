import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Occasion } from '@prisma/client';

type PhotoInput = {
  src: string;
  caption?: string | null;
};

type GiftInput = {
  brand: string;
  amountCents: number;
  redemptionUrl?: string | null;
};

export type PremiumWatercolorRenderInput = {
  slug: string;
  recipientName: string;
  senderName?: string | null;
  occasion: Occasion;
  message: string;
  photos: PhotoInput[];
  gift?: GiftInput | null;
};

const TEMPLATE_FILE = 'happy_birthday_maya.html';

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

const PREMIUM_STYLE = `
.lcs-premium-photos {
  position: fixed;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.lcs-premium-photo {
  position: absolute;
  width: min(30vw, 220px);
  aspect-ratio: 4 / 5;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: 0 22px 48px rgba(0,0,0,0.16);
  transform: rotate(var(--rot));
  opacity: var(--op);
  mix-blend-mode: multiply;
}

.lcs-premium-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lcs-premium-gift {
  position: fixed;
  left: 50%;
  bottom: 6rem;
  transform: translateX(-50%);
  z-index: 8;
  width: min(92vw, 380px);
  text-align: center;
}

.lcs-premium-gift-open {
  border: 1px solid rgba(120,60,80,0.35);
  border-radius: 999px;
  background: rgba(255,255,255,0.75);
  color: rgba(120,60,80,0.9);
  font: 600 11px/1 system-ui, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 10px 16px;
  cursor: pointer;
}

.lcs-premium-gift-card {
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba(120,60,80,0.25);
  background: rgba(255,255,255,0.82);
  color: rgba(120,60,80,0.9);
  padding: 14px;
  opacity: 0;
  transform: translateY(10px) scale(0.98);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.lcs-premium-gift-card.open {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.lcs-premium-gift-brand {
  margin: 0;
  font: 500 22px/1.2 Georgia, serif;
}

.lcs-premium-gift-amount {
  margin: 6px 0 0;
  font: 700 26px/1.1 system-ui, sans-serif;
}

.lcs-premium-gift-note {
  margin: 7px 0 0;
  font: 400 14px/1.35 system-ui, sans-serif;
}

.lcs-premium-gift-link {
  display: inline-flex;
  margin-top: 10px;
  border: 1px solid rgba(120,60,80,0.3);
  border-radius: 999px;
  padding: 8px 14px;
  color: rgba(120,60,80,0.95);
  text-decoration: none;
  font: 600 11px/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.lcs-premium-gift-link[aria-disabled='true'] {
  opacity: 0.6;
  pointer-events: none;
}
`;

let templateCache: string | null = null;

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

function formatUsd(amountCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amountCents / 100);
}

function getTemplateHtml() {
  if (templateCache) {
    return templateCache;
  }

  const filePath = path.join(process.cwd(), 'themes', TEMPLATE_FILE);
  templateCache = readFileSync(filePath, 'utf8');
  return templateCache;
}

function buildGiftMarkup(gift: GiftInput | null | undefined, recipientName: string) {
  if (!gift) {
    return '';
  }

  const amount = formatUsd(gift.amountCents);
  const redeemMarkup = gift.redemptionUrl
    ? `<a class="lcs-premium-gift-link" href="${escapeHtml(gift.redemptionUrl)}" target="_blank" rel="noopener">Redeem gift</a>`
    : '<span class="lcs-premium-gift-link" aria-disabled="true">Gift unlocks soon</span>';

  return `
<div class="lcs-premium-gift">
  <button id="lcs-premium-gift-open" class="lcs-premium-gift-open" type="button">Open your gift</button>
  <div id="lcs-premium-gift-card" class="lcs-premium-gift-card" aria-hidden="true">
    <p class="lcs-premium-gift-brand">${escapeHtml(gift.brand)}</p>
    <p class="lcs-premium-gift-amount">${escapeHtml(amount)}</p>
    <p class="lcs-premium-gift-note">A little something extra for you, ${escapeHtml(recipientName)}.</p>
    ${redeemMarkup}
  </div>
</div>`;
}

function buildPatchScript(data: {
  recipientName: string;
  occasionLabel: string;
  senderName: string;
  message: string;
  photos: string[];
}) {
  const payload = escapeJsonForScript(data);

  return `<script>
(function () {
  var data = ${payload};

  function setText(selector, value) {
    var node = document.querySelector(selector);
    if (!node || !value) {
      return;
    }
    node.textContent = String(value);
  }

  setText('.card-title', data.occasionLabel);
  setText('.card-name', data.recipientName);
  setText('.card-sub', 'crafted by hand for this moment');

  var cardMsg = document.querySelector('.card-msg');
  if (cardMsg) {
    var combined = String(data.message || '').trim();
    if (data.senderName) {
      combined += '\n\n- ' + data.senderName;
    }
    cardMsg.textContent = combined;
    cardMsg.style.whiteSpace = 'pre-line';
  }

  document.title = data.occasionLabel + ' ' + data.recipientName + ' - LiveCardStudio Premium Watercolor';

  var photos = Array.isArray(data.photos) ? data.photos.filter(Boolean) : [];
  if (photos.length) {
    var layer = document.createElement('div');
    layer.className = 'lcs-premium-photos';

    var positions = [
      { left: '4vw', top: '16vh', rot: '-7deg', op: '0.45' },
      { right: '4vw', top: '18vh', rot: '6deg', op: '0.42' },
      { left: '9vw', bottom: '14vh', rot: '8deg', op: '0.36' },
      { right: '10vw', bottom: '16vh', rot: '-6deg', op: '0.34' },
      { left: '34vw', top: '9vh', rot: '-3deg', op: '0.28' },
      { right: '34vw', bottom: '10vh', rot: '4deg', op: '0.24' }
    ];

    photos.slice(0, 6).forEach(function (src, index) {
      var card = document.createElement('div');
      card.className = 'lcs-premium-photo';
      var pos = positions[index] || positions[index % positions.length];
      Object.keys(pos).forEach(function (key) {
        card.style.setProperty(key, pos[key]);
      });
      card.style.setProperty('--rot', pos.rot);
      card.style.setProperty('--op', pos.op);

      var img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = 'Memory ' + (index + 1);
      img.src = src;
      card.appendChild(img);
      layer.appendChild(card);
    });

    document.body.appendChild(layer);
  }

  var giftOpen = document.getElementById('lcs-premium-gift-open');
  var giftCard = document.getElementById('lcs-premium-gift-card');
  if (giftOpen && giftCard) {
    giftOpen.addEventListener('click', function () {
      giftCard.classList.add('open');
      giftCard.setAttribute('aria-hidden', 'false');
      giftOpen.remove();
    });
  }
})();
</script>`;
}

export function renderPremiumWatercolorHtml(input: PremiumWatercolorRenderInput) {
  const occasionLabel = OCCASION_COPY[input.occasion] || 'A Living Card';
  const senderName = (input.senderName || '').trim();
  const photoSources = input.photos.map((photo) => photo.src).filter(Boolean);

  let html = getTemplateHtml();
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(`${occasionLabel} ${input.recipientName}`)}</title>`);
  html = html.replace('</style>', `${PREMIUM_STYLE}\n</style>`);

  const giftMarkup = buildGiftMarkup(input.gift, input.recipientName);
  if (giftMarkup) {
    html = html.replace('</body>', `${giftMarkup}\n</body>`);
  }

  const patchScript = buildPatchScript({
    recipientName: input.recipientName,
    occasionLabel,
    senderName,
    message: input.message,
    photos: photoSources
  });

  html = html.replace('</body>', `${patchScript}\n</body>`);
  return html;
}
