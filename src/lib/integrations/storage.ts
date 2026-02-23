import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '@/lib/env';

const hasS3 = Boolean(
  env.S3_BUCKET_NAME && env.AWS_REGION && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
);

const s3Client = hasS3
  ? new S3Client({
      region: env.AWS_REGION,
      endpoint: env.AWS_ENDPOINT,
      forcePathStyle: Boolean(env.AWS_ENDPOINT),
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
      }
    })
  : null;

function contentUrlForKey(key: string) {
  if (!hasS3 || !env.S3_BUCKET_NAME) {
    return `storage://${key}`;
  }

  if (env.AWS_ENDPOINT) {
    const endpoint = env.AWS_ENDPOINT.replace(/\/$/, '');
    return `${endpoint}/${env.S3_BUCKET_NAME}/${key}`;
  }

  return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

async function uploadLocal(key: string, data: Buffer | string) {
  const fullPath = join(process.cwd(), 'storage', key);
  const folder = join(fullPath, '..');
  await mkdir(folder, { recursive: true });
  await writeFile(fullPath, data);
  return `storage://${key}`;
}

export async function uploadHtml(slug: string, html: string) {
  const key = `cards/${slug}.html`;

  if (!s3Client || !env.S3_BUCKET_NAME) {
    return uploadLocal(key, html);
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: html,
      ContentType: 'text/html; charset=utf-8',
      CacheControl: 'public,max-age=31536000,immutable'
    })
  );

  return contentUrlForKey(key);
}

export async function uploadImage(key: string, data: Buffer, contentType = 'image/png') {
  if (!s3Client || !env.S3_BUCKET_NAME) {
    return uploadLocal(key, data);
  }

  await new Upload({
    client: s3Client,
    params: {
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: data,
      ContentType: contentType,
      CacheControl: 'public,max-age=31536000,immutable'
    }
  }).done();

  return contentUrlForKey(key);
}
