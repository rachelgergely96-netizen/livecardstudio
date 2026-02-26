import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Occasion, PremiumTheme } from '@prisma/client';

type PhotoInput = {
  src: string;
  caption?: string | null;
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

type SignaturePremiumTheme = Exclude<PremiumTheme, 'WATERCOLOR'>;

export type PremiumSignatureRenderInput = {
  slug: string;
  recipientName: string;
  senderName?: string | null;
  occasion: Occasion;
  premiumTheme: SignaturePremiumTheme;
  message: string;
  photos: PhotoInput[];
  customAudio?: CustomAudioInput;
  gift?: GiftInput | null;
};

const PREMIUM_SIGNATURE_TEMPLATE_FILES: Record<SignaturePremiumTheme, string> = {
  CELESTIAL: 'premium-celestial.html',
  MIDNIGHT_GARDEN: 'premium-midnight-garden.html',
  BOTANICAL: 'premium-botanical.html',
  GOLDEN_HOUR: 'premium-golden-hour.html',
  MODERN_MINIMAL: 'premium-modern-minimal.html',
  PASTEL_DREAM: 'premium-pastel-dream.html',
  ETERNAL_VOW: 'premium-eternal-vow.html',
  GRAND_CELEBRATION: 'premium-grand-celebration.html'
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

const PREMIUM_SIGNATURE_STYLE = `
.lcs-gift-link {
  display: inline-flex;
  margin-top: 12px;
  border: 1px solid rgba(255,255,255,0.28);
  border-radius: 999px;
  padding: 8px 14px;
  color: rgba(255,255,255,0.92);
  text-decoration: none;
  font: 600 11px/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.12);
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

function formatUsd(amountCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amountCents / 100);
}

function getTemplateHtml(theme: SignaturePremiumTheme) {
  const fileName = PREMIUM_SIGNATURE_TEMPLATE_FILES[theme];
  const cached = templateCache.get(fileName);
  if (cached) {
    return cached;
  }

  const filePath = path.join(process.cwd(), 'themes', fileName);
  const html = readFileSync(filePath, 'utf8');
  templateCache.set(fileName, html);
  return html;
}

function buildPatchScript(data: {
  recipientName: string;
  senderName: string;
  occasionLabel: string;
  message: string;
  photos: string[];
  customAudio?: { url: string; name?: string | null };
  gift?: { brand: string; amount: string; redemptionUrl?: string | null };
}) {
  const payload = escapeJsonForScript(data);

  return `<script>
(function () {
  var data = ${payload};

  function setText(selector, value) {
    if (!value) return;
    var nodes = document.querySelectorAll(selector);
    nodes.forEach(function (node) {
      node.textContent = String(value);
    });
  }

  setText('.hero-occasion', data.occasionLabel);
  setText('.msg-occasion', data.occasionLabel);

  var singleName = document.querySelector('.hero-name');
  if (singleName) {
    singleName.textContent = data.recipientName;
  }

  var pairNames = document.querySelectorAll('.hero-names');
  if (pairNames.length) {
    pairNames[0].textContent = data.recipientName;
    if (pairNames.length > 1 && data.senderName) {
      pairNames[1].textContent = data.senderName;
    }
  }

  var msgText = document.querySelector('.msg-text');
  if (msgText) {
    msgText.textContent = data.message || '';
    msgText.style.whiteSpace = 'pre-line';
  }

  var msgFrom = document.querySelector('.msg-from');
  if (msgFrom && data.senderName) {
    msgFrom.textContent = data.senderName.trim().startsWith('—') ? data.senderName.trim() : '— ' + data.senderName.trim();
  }

  document.title = data.occasionLabel + ' for ' + data.recipientName;

  var photos = Array.isArray(data.photos) ? data.photos.filter(Boolean) : [];
  if (photos.length) {
    var photoNodes = document.querySelectorAll('.photo-frame img');
    photoNodes.forEach(function (img, index) {
      img.src = photos[index % photos.length];
      img.alt = 'Memory ' + (index + 1) + ' for ' + data.recipientName;
    });
  }

  var brandLink = document.querySelector('.lcs-logo');
  if (brandLink) {
    brandLink.setAttribute('href', 'https://livecardstudio.com');
    brandLink.setAttribute('target', '_blank');
    brandLink.setAttribute('rel', 'noopener');
  }

  var giftSections = document.querySelectorAll('.gift-section');
  if (!data.gift) {
    giftSections.forEach(function (section) {
      section.remove();
    });
  } else {
    giftSections.forEach(function (section) {
      var label = section.querySelector('.gift-label');
      if (label) {
        label.textContent = data.gift.brand + ' gift for you';
      }

      var amount = section.querySelector('.gift-amount');
      if (amount) {
        amount.textContent = data.gift.amount;
        amount.classList.remove('gift-hidden');
        amount.classList.add('gift-revealed');
      }

      if (data.gift.redemptionUrl) {
        var card = section.querySelector('.gift-card');
        if (card && !section.querySelector('.lcs-gift-link')) {
          var link = document.createElement('a');
          link.className = 'lcs-gift-link';
          link.href = data.gift.redemptionUrl;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = 'Redeem gift';
          card.appendChild(link);
        }
      }
    });
  }

  if (data.customAudio && data.customAudio.url) {
    var soundBars = document.getElementById('soundBars');
    var soundLabel = document.getElementById('soundLabel');
    var audio = new Audio(data.customAudio.url);
    audio.loop = true;
    audio.preload = 'auto';

    function syncAudioUi() {
      if (soundBars) {
        if (audio.paused) {
          soundBars.classList.add('paused');
        } else {
          soundBars.classList.remove('paused');
        }
      }
      if (soundLabel) {
        soundLabel.textContent = audio.paused ? 'tap to play soundtrack' : (data.customAudio.name || 'playing soundtrack');
      }
    }

    window.toggleSound = function () {
      if (audio.paused) {
        audio.play().then(syncAudioUi).catch(function () {
          if (soundLabel) {
            soundLabel.textContent = 'tap to play soundtrack';
          }
        });
      } else {
        audio.pause();
        syncAudioUi();
      }
    };

    syncAudioUi();
  }
})();
</script>`;
}

export function renderPremiumSignatureThemeHtml(input: PremiumSignatureRenderInput) {
  const occasionLabel = OCCASION_COPY[input.occasion] || 'A Living Card';
  const senderName = (input.senderName || 'With love').trim();
  const photoSources = input.photos.map((photo) => photo.src).filter(Boolean);

  let html = getTemplateHtml(input.premiumTheme);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(`${occasionLabel} ${input.recipientName}`)}</title>`);
  html = html.replace('</style>', `${PREMIUM_SIGNATURE_STYLE}\n</style>`);

  const patchScript = buildPatchScript({
    recipientName: input.recipientName,
    senderName,
    occasionLabel,
    message: input.message,
    photos: photoSources,
    customAudio: input.customAudio?.url
      ? {
          url: input.customAudio.url,
          name: input.customAudio.name
        }
      : undefined,
    gift: input.gift
      ? {
          brand: input.gift.brand,
          amount: formatUsd(input.gift.amountCents),
          redemptionUrl: input.gift.redemptionUrl
        }
      : undefined
  });

  html = html.replace('</body>', `${patchScript}\n</body>`);
  return html;
}

