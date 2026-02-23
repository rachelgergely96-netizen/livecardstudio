import { Card, GiftCard, Photo } from '@prisma/client';
import { CardGenerationInput } from '@/lib/cards/html-generator';

export type CardWithAssets = Card & {
  photos: Photo[];
  giftCard: GiftCard | null;
};

export function toCardGenerationInput(card: CardWithAssets): CardGenerationInput {
  const message = card.message || '';

  return {
    slug: card.slug,
    recipientName: card.recipientName,
    title: card.title,
    occasion: card.occasion,
    theme: card.theme,
    message,
    sectionMessages: Array.isArray(card.sectionMessages)
      ? card.sectionMessages.map((line) => String(line))
      : undefined,
    musicStyle: card.musicStyle,
    photos: card.photos
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        src: photo.base64Data || photo.processedUrl || photo.originalUrl,
        caption: photo.caption
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
