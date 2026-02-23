import { CardStatus } from '@prisma/client';
import { toCardGenerationInput } from '@/lib/cards/build-card-input';
import { generateCardHtml } from '@/lib/cards/html-generator';
import { prisma } from '@/lib/db/prisma';
import { uploadHtml } from '@/lib/integrations/storage';
import { absoluteUrl } from '@/lib/utils';

type RegenerateOptions = {
  status?: CardStatus;
  markPublishedAt?: boolean;
};

export async function regenerateCardHtml(cardId: string, options: RegenerateOptions = {}) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      photos: { orderBy: { sortOrder: 'asc' } },
      giftCard: true,
      user: { select: { name: true } }
    }
  });

  if (!card) {
    throw new Error('Card not found');
  }

  if (!card.photos.length) {
    throw new Error('Card needs at least one photo');
  }

  const input = toCardGenerationInput(card);
  input.senderName = card.user?.name || 'With love';

  const html = generateCardHtml(input);
  const htmlUrl = await uploadHtml(card.slug, html);

  return prisma.card.update({
    where: { id: card.id },
    data: {
      htmlUrl,
      ogImageUrl: card.ogImageUrl || absoluteUrl(`/og/${card.slug}.png`),
      status: options.status || card.status,
      publishedAt: options.markPublishedAt ? new Date() : card.publishedAt
    },
    include: {
      photos: true,
      giftCard: true
    }
  });
}
