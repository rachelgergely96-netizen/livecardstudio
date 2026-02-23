import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { processUploadedPhoto } from '@/lib/cards/photo-processing';
import { prisma } from '@/lib/db/prisma';
import { uploadImage } from '@/lib/integrations/storage';

function parseCaption(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 160) : null;
}

async function findOwnedPhoto(userId: string, cardId: string, photoId: string) {
  return prisma.photo.findFirst({
    where: {
      id: photoId,
      cardId,
      card: {
        userId
      }
    }
  });
}

export async function PUT(
  request: Request,
  context: { params: { id: string; photoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const photo = await findOwnedPhoto(session.user.id, context.params.id, context.params.photoId);
    if (!photo) {
      return notFound('Photo not found');
    }

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const maybeFile = formData.get('photo');
      const caption = parseCaption(formData.get('caption'));
      const file = maybeFile instanceof File ? maybeFile : null;

      if (!file) {
        return badRequest('Missing photo file payload.');
      }

      let processed;
      try {
        processed = await processUploadedPhoto(file);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not process uploaded photo.';
        return badRequest(message);
      }

      const objectKey = `photos/${photo.cardId}/${photo.id}-${Date.now()}.jpg`;
      const uploadedUrl = await uploadImage(objectKey, processed.buffer, processed.mimeType);

      const updated = await prisma.photo.update({
        where: { id: photo.id },
        data: {
          originalUrl: uploadedUrl,
          processedUrl: uploadedUrl,
          base64Data: processed.base64DataUrl,
          caption,
          width: processed.width,
          height: processed.height
        }
      });

      return ok({ photo: updated });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid photo update payload.');
    }

    const caption = parseCaption((body as Record<string, unknown>).caption);

    const updated = await prisma.photo.update({
      where: { id: photo.id },
      data: {
        caption
      }
    });

    return ok({ photo: updated });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string; photoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const photo = await findOwnedPhoto(session.user.id, context.params.id, context.params.photoId);

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
