import { Card, GiftCard, Photo } from '@prisma/client';
import { CardGenerationInput } from '@/lib/cards/html-generator';

export type CardWithAssets = Card & {
  photos: Photo[];
  giftCard: GiftCard | null;
};

function readCustomAudio(paintData: unknown) {
  if (!paintData || typeof paintData !== 'object' || Array.isArray(paintData)) {
    return undefined;
  }

  const audio = (paintData as Record<string, unknown>).customAudio;
  if (!audio || typeof audio !== 'object' || Array.isArray(audio)) {
    return undefined;
  }

  const url = (audio as Record<string, unknown>).url;
  if (typeof url !== 'string' || !url.trim()) {
    return undefined;
  }

  const name = (audio as Record<string, unknown>).name;
  const mimeType = (audio as Record<string, unknown>).mimeType;

  return {
    url,
    name: typeof name === 'string' ? name : undefined,
    mimeType: typeof mimeType === 'string' ? mimeType : undefined
  };
}

export function toCardGenerationInput(card: CardWithAssets): CardGenerationInput {
  const message = card.message || '';

  return {
    slug: card.slug,
    recipientName: card.recipientName,
    title: card.title,
    occasion: card.occasion,
    tier: card.tier,
    quickTheme: card.quickTheme || undefined,
    premiumTheme: card.premiumTheme || undefined,
    message,
    sectionMessages: Array.isArray(card.sectionMessages)
      ? card.sectionMessages.map((line) => String(line))
      : undefined,
    musicStyle: card.musicStyle,
    customAudio: readCustomAudio(card.paintData),
    photos: card.photos
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        src: photo.slotType === 'TEXT_PANEL' ? '' : (photo.base64Data || photo.processedUrl || photo.originalUrl),
        caption: photo.caption,
        slotType: photo.slotType as 'PHOTO' | 'TEXT_PANEL',
        textContent: photo.textContent
      })),
    features:
      card.featureToggles && typeof card.featureToggles === 'object'
        ? (card.featureToggles as Record<string, boolean>)
        : undefined,
    gift: card.giftCard
      ? {
          brand: card.giftCard.brand,
          amountCents: card.giftCard.amount,
          redemptionUrl: card.giftCard.redemptionUrl
        }
      : null
  };
}
