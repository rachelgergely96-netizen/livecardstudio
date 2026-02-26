import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { notFound, serverError } from '@/lib/api';

const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  html: 'text/html; charset=utf-8'
};

export async function GET(_request: Request, context: { params: { path: string[] } }) {
  try {
    const parts = context.params.path || [];
    if (!parts.length) {
      return notFound('File not found');
    }

    const storageRoot = path.resolve(process.cwd(), 'storage');
    const requested = path.resolve(storageRoot, ...parts);
    if (!requested.startsWith(storageRoot)) {
      return notFound('File not found');
    }

    let buffer: Buffer;
    try {
      buffer = await readFile(requested);
    } catch {
      return notFound('File not found');
    }

    const ext = path.extname(requested).replace(/^\./, '').toLowerCase();
    const contentType = MIME_BY_EXTENSION[ext] || 'application/octet-stream';

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return serverError(error);
  }
}
