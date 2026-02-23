import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function readStorageContent(uri: string) {
  if (uri.startsWith('storage://')) {
    const key = uri.replace('storage://', '');
    const filePath = join(process.cwd(), 'storage', key);
    return readFile(filePath, 'utf8');
  }

  const response = await fetch(uri, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch stored content: ${response.status}`);
  }

  return response.text();
}
