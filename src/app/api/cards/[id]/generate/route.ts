import { CardStatus } from '@prisma/client';
import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { regenerateCardHtml } from '@/lib/cards/publish';
import { prisma } from '@/lib/db/prisma';
import { absoluteUrl } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(_request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const card = await prisma.card.findFirst({
      where: { id: context.params.id, userId: session.user.id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        giftCard: true,
        user: {
          select: { name: true }
        }
      }
    });

    if (!card) {
      return notFound('Card not found');
    }

    if (!card.photos.length) {
      return badRequest('Add at least one photo before generating card HTML.');
    }

    const updated = await regenerateCardHtml(card.id, { status: CardStatus.PREVIEW });

    return ok({
      card: updated,
      previewUrl: absoluteUrl(`/c/${card.slug}`),
      htmlUrl: updated.htmlUrl
    });
  } catch (error) {
    return serverError(error);
  }
}
