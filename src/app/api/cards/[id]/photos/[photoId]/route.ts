import { auth } from '@/lib/auth/session';
import { notFound, ok, serverError, unauthorized } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(
  _request: Request,
  context: { params: { id: string; photoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const photo = await prisma.photo.findFirst({
      where: {
        id: context.params.photoId,
        cardId: context.params.id,
        card: {
          userId: session.user.id
        }
      }
    });

    if (!photo) {
      return notFound('Photo not found');
    }

    await prisma.photo.delete({ where: { id: photo.id } });

    const remaining = await prisma.photo.findMany({
      where: { cardId: context.params.id },
      orderBy: { sortOrder: 'asc' }
    });

    await Promise.all(
      remaining.map((item, index) =>
        prisma.photo.update({
          where: { id: item.id },
          data: { sortOrder: index }
        })
      )
    );

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
