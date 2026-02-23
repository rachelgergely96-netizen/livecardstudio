import sharp from 'sharp';

const MAX_WIDTH = 800;
const QUALITY = 78;
const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'];

export type ProcessedPhoto = {
  mimeType: string;
  buffer: Buffer;
  base64DataUrl: string;
  width: number;
  height: number;
};

function readFtypBrand(buffer: Buffer) {
  if (buffer.length < 12) return '';
  return buffer.subarray(8, 12).toString('ascii').toLowerCase();
}

export function detectLikelyHeicFromBuffer(buffer: Buffer, fileName?: string, mimeType?: string) {
  const ext = (fileName || '').toLowerCase().split('.').pop() || '';
  if (ext === 'heic' || ext === 'heif') {
    return true;
  }

  if ((mimeType || '').toLowerCase().includes('heic') || (mimeType || '').toLowerCase().includes('heif')) {
    return true;
  }

  const brand = readFtypBrand(buffer);
  return HEIC_BRANDS.includes(brand);
}

function prettyPhotoError(fileName: string, isLikelyHeic: boolean) {
  if (isLikelyHeic) {
    return `Could not process "${fileName}". HEIC/HEIF decoding is unavailable on this server. Please convert to JPG or PNG and try again.`;
  }
  return `Could not process "${fileName}". Please use a valid JPG, PNG, or HEIC image.`;
}

export async function processUploadedPhoto(file: File): Promise<ProcessedPhoto> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const likelyHeic = detectLikelyHeicFromBuffer(inputBuffer, file.name, file.type);
  const fileName = file.name || 'photo';

  try {
    const transformer = sharp(inputBuffer).rotate();
    const metadata = await transformer.metadata();
    const needsResize = (metadata.width || 0) > MAX_WIDTH;

    const resized = transformer.resize({
      width: needsResize ? MAX_WIDTH : undefined,
      withoutEnlargement: true
    });

    const output = await resized.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
    const outputMeta = await sharp(output).metadata();

    const base64DataUrl = `data:image/jpeg;base64,${output.toString('base64')}`;

    return {
      mimeType: 'image/jpeg',
      buffer: output,
      base64DataUrl,
      width: outputMeta.width || metadata.width || MAX_WIDTH,
      height: outputMeta.height || metadata.height || MAX_WIDTH
    };
  } catch (error) {
    const message = prettyPhotoError(fileName, likelyHeic);
    const wrapped = new Error(message);
    (wrapped as Error & { cause?: unknown }).cause = error;
    throw wrapped;
  }
}
