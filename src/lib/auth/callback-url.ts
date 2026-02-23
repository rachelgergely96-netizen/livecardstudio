export function normalizeCallbackUrl(value?: string | null, fallback = '/dashboard') {
  if (!value) {
    return fallback;
  }

  // Allow only internal app paths.
  if (!value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}
