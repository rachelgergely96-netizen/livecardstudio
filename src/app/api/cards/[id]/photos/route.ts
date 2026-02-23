import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { processUploadedPhoto } from '@/lib/cards/photo-processing';
import { prisma } from '@/lib/db/prisma';
import { uploadImage } from '@/lib/integrations/storage';

export const runtime = 'nodejs';

const MAX_PHOTOS_PREMIUM = 12;
const MAX_PHOTOS_FREE = 4;

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

    const formData = await request.formData();
    const fileEntries = formData.getAll('photos').filter((value): value is File => value instanceof File);

    if (!fileEntries.length) {
      return badRequest('No photos uploaded. Use form-data key "photos".');
    }

    const tierCap = session.user.plan === 'FREE' ? MAX_PHOTOS_FREE : MAX_PHOTOS_PREMIUM;
    if (card.photos.length + fileEntries.length > tierCap) {
      return badRequest(`Photo limit exceeded. Your plan allows up to ${tierCap} photos.`);
    }

    const startingOrder = card.photos.length;

    const createdPhotos = [];
    for (const [index, file] of fileEntries.entries()) {
      let processed;
      try {
        processed = await processUploadedPhoto(file);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not process an uploaded photo.';
        return badRequest(message);
      }

      const objectKey = `photos/${card.id}/${Date.now()}-${index}.jpg`;
      const uploadedUrl = await uploadImage(objectKey, processed.buffer, processed.mimeType);

      const photo = await prisma.photo.create({
        data: {
          cardId: card.id,
          originalUrl: uploadedUrl,
          processedUrl: uploadedUrl,
          base64Data: processed.base64DataUrl,
          caption: null,
          sortOrder: startingOrder + index,
          width: processed.width,
          height: processed.height
        }
      });

      createdPhotos.push(photo);
    }

    return ok({ photos: createdPhotos });
  } catch (error) {
    return serverError(error);
  }
}
