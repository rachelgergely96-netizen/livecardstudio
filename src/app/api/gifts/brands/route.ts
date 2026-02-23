import { ok, serverError } from '@/lib/api';
import { env } from '@/lib/env';
import { fallbackGiftBrands } from '@/lib/integrations/gift-fallback';
import { fetchGiftBrands, getGiftDenominationRule } from '@/lib/integrations/tremendous';

export async function GET() {
  try {
    if (!env.TREMENDOUS_API_KEY) {
      return ok({ brands: fallbackGiftBrands });
    }

    const brands = await fetchGiftBrands();
    return ok({
      brands: brands.map((brand) => ({
        ...brand,
        denominationRule: getGiftDenominationRule(brand)
      }))
    });
  } catch (error) {
    return serverError(error);
  }
}
