import { auth } from '@/lib/auth/session';
import { notFound, ok, serverError, unauthorized } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const card = await prisma.card.findFirst({
      where: { id: context.params.id, userId: session.user.id },
      select: {
        id: true,
        slug: true,
        status: true,
        viewCount: true,
        firstViewedAt: true,
        createdAt: true,
        publishedAt: true,
        updatedAt: true
      }
    });

    if (!card) {
      return notFound('Card not found');
    }

    return ok({
      stats: card
    });
  } catch (error) {
    return serverError(error);
  }
}
