import { CardStatus, CardTier, Occasion } from '@prisma/client';

export type DashboardPhotoRecord = {
  base64Data: string | null;
  processedUrl: string | null;
  originalUrl: string;
};

export type DashboardCardRecord = {
  id: string;
  slug: string;
  recipientName: string;
  occasion: Occasion;
  tier: CardTier;
  status: CardStatus;
  viewCount: number;
  createdAt: Date;
  publishedAt: Date | null;
  firstViewedAt: Date | null;
  photos: DashboardPhotoRecord[];
};

export type DashboardCardSerializable = Omit<
  DashboardCardRecord,
  'createdAt' | 'publishedAt' | 'firstViewedAt'
> & {
  createdAt: string;
  publishedAt: string | null;
  firstViewedAt: string | null;
};

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function serializeCards(cards: DashboardCardRecord[]): DashboardCardSerializable[] {
  return cards.map((card) => ({
    ...card,
    createdAt: card.createdAt.toISOString(),
    publishedAt: toIso(card.publishedAt),
    firstViewedAt: toIso(card.firstViewedAt)
  }));
}

