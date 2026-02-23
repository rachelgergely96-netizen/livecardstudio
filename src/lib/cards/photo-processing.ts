import sharp from 'sharp';

const MAX_WIDTH = 800;
const QUALITY = 78;

export type ProcessedPhoto = {
  mimeType: string;
  buffer: Buffer;
  base64DataUrl: string;
  width: number;
  height: number;
};

export async function processUploadedPhoto(file: File): Promise<ProcessedPhoto> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

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
}
