import { ok, serverError } from '@/lib/api';
import { env } from '@/lib/env';
import { fallbackGiftBrands } from '@/lib/integrations/gift-fallback';
import { fetchGiftBrands } from '@/lib/integrations/tremendous';

let cachedAt = 0;
let cachedBrands: Awaited<ReturnType<typeof fetchGiftBrands>> = [];
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    if (!env.TREMENDOUS_API_KEY) {
      return ok({ brands: fallbackGiftBrands });
    }

    if (!cachedBrands.length || Date.now() - cachedAt > CACHE_TTL_MS) {
      cachedBrands = await fetchGiftBrands();
      cachedAt = Date.now();
    }

    return ok({ brands: cachedBrands });
  } catch (error) {
    return serverError(error);
  }
}
