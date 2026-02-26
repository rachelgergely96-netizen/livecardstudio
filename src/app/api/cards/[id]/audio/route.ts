import path from 'node:path';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth/session';
import { badRequest, notFound, ok, serverError, unauthorized } from '@/lib/api';
import { prisma } from '@/lib/db/prisma';
import { uploadBinary } from '@/lib/integrations/storage';

export const runtime = 'nodejs';

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/webm'
]);

type StoredAudio = {
  url: string;
  name: string;
  mimeType: string;
  bytes: number;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function extensionForFile(file: File) {
  const fromName = path.extname(file.name || '').toLowerCase().replace(/^\./, '');
  if (fromName) {
    return fromName;
  }
  if (file.type === 'audio/mp4') return 'm4a';
  if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') return 'mp3';
  if (file.type === 'audio/wav' || file.type === 'audio/x-wav') return 'wav';
  if (file.type === 'audio/ogg') return 'ogg';
  if (file.type === 'audio/webm') return 'webm';
  return 'bin';
}

function asObject(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, Prisma.JsonValue>;
  }

  return { ...(value as Record<string, Prisma.JsonValue>) };
}

function resolvePublicUrl(uploadedUrl: string) {
  if (!uploadedUrl.startsWith('storage://')) {
    return uploadedUrl;
  }

  const key = uploadedUrl.replace('storage://', '').replace(/^\/+/, '');
  return `/api/storage/${key}`;
}

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const card = await prisma.card.findFirst({
      where: {
        id: context.params.id,
        userId: session.user.id
      },
      select: {
        id: true,
        paintData: true
      }
    });
    if (!card) {
      return notFound('Card not found');
    }

    const formData = await request.formData();
    const audio = formData.get('audio');
    if (!(audio instanceof File)) {
      return badRequest('No audio uploaded. Use form-data key "audio".');
    }

    if (audio.size <= 0) {
      return badRequest('Uploaded audio file is empty.');
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return badRequest('Audio file is too large. Maximum size is 15 MB.');
    }
    if (audio.type && !ALLOWED_MIME_TYPES.has(audio.type)) {
      return badRequest('Unsupported audio format. Use MP3, WAV, OGG, M4A, AAC, or WebM audio.');
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const extension = extensionForFile(audio);
    const safeName = sanitizeFileName(audio.name || `track.${extension}`);
    const objectKey = `audio/${card.id}/${Date.now()}-${safeName || `track.${extension}`}`;
    const uploadedUrl = await uploadBinary(objectKey, buffer, audio.type || 'application/octet-stream');
    const publicUrl = resolvePublicUrl(uploadedUrl);

    const storedAudio: StoredAudio = {
      url: publicUrl,
      name: audio.name || `track.${extension}`,
      mimeType: audio.type || 'application/octet-stream',
      bytes: audio.size
    };

    const nextPaintData = {
      ...asObject(card.paintData),
      customAudio: storedAudio
    } as Prisma.InputJsonValue;

    await prisma.card.update({
      where: { id: card.id },
      data: {
        paintData: nextPaintData
      }
    });

    return ok({ audio: storedAudio });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const card = await prisma.card.findFirst({
      where: {
        id: context.params.id,
        userId: session.user.id
      },
      select: {
        id: true,
        paintData: true
      }
    });
    if (!card) {
      return notFound('Card not found');
    }

    const nextPaintData = asObject(card.paintData);
    delete nextPaintData.customAudio;

    await prisma.card.update({
      where: { id: card.id },
      data: {
        paintData: Object.keys(nextPaintData).length ? (nextPaintData as Prisma.InputJsonValue) : Prisma.DbNull
      }
    });

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
