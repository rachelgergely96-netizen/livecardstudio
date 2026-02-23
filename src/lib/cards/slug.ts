import { randomBytes } from 'node:crypto';

function sanitize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
}

export function createCardSlug(seed: string) {
  const base = sanitize(seed) || 'card';
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}
