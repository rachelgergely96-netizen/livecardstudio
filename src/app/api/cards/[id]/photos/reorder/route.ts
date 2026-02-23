import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';

const reorderSchema = z.object({
  photoIds: z.array(z.string().min(1)).min(1)
});

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const card = await prisma.card.findFirst({
      where: { id: context.params.id, userId: session.user.id },
      include: { photos: true }
    });

    if (!card) {
      return notFound('Card not found');
    }

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid reorder payload', parsed.error.flatten());
    }

    const { photoIds } = parsed.data;
    const existingIds = new Set(card.photos.map((photo) => photo.id));

    if (photoIds.length !== card.photos.length || photoIds.some((id) => !existingIds.has(id))) {
      return badRequest('Photo order list must include all card photos exactly once.');
    }

    await prisma.$transaction(
      photoIds.map((photoId, index) =>
        prisma.photo.update({
          where: { id: photoId },
          data: { sortOrder: index }
        })
      )
    );

    const photos = await prisma.photo.findMany({
      where: { cardId: card.id },
      orderBy: { sortOrder: 'asc' }
    });

    return ok({ photos });
  } catch (error) {
    return serverError(error);
  }
}
