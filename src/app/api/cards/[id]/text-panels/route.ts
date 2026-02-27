import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';

const MAX_ITEMS_PREMIUM = 12;
const MAX_ITEMS_FREE = 4;
const MAX_ITEMS_QUICK = 1;

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const card = await prisma.card.findFirst({
      where: { id: context.params.id, userId: session.user.id },
      include: { photos: { orderBy: { sortOrder: 'asc' } } }
    });

    if (!card) {
      return notFound('Card not found');
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid request body.');
    }

    const textContent = typeof (body as Record<string, unknown>).textContent === 'string'
      ? ((body as Record<string, unknown>).textContent as string).trim().slice(0, 2000)
      : '';

    if (!textContent) {
      return badRequest('Text content is required.');
    }

    const cap =
      card.tier === 'QUICK'
        ? MAX_ITEMS_QUICK
        : session.user.plan === 'FREE'
        ? MAX_ITEMS_FREE
        : MAX_ITEMS_PREMIUM;

    if (card.photos.length >= cap) {
      return badRequest(`Item limit reached. Your plan allows up to ${cap} items per card.`);
    }

    const panel = await prisma.photo.create({
      data: {
        cardId: card.id,
        slotType: 'TEXT_PANEL',
        originalUrl: 'text-panel',
        textContent,
        caption: null,
        sortOrder: card.photos.length
      }
    });

    return ok({ panel });
  } catch (error) {
    return serverError(error);
  }
}
