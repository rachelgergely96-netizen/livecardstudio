import { notFound, ok, serverError } from '@/lib/api';
import { env } from '@/lib/env';
import { fallbackGiftBrands } from '@/lib/integrations/gift-fallback';
import { fetchGiftBrands, getGiftDenominationRule } from '@/lib/integrations/tremendous';

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    if (!env.TREMENDOUS_API_KEY) {
      const brand = fallbackGiftBrands.find((item) => item.id === context.params.id);
      if (!brand) {
        return notFound('Brand not found');
      }
      return ok({ brand });
    }

    const brands = await fetchGiftBrands();
    const brand = brands.find((item) => item.id === context.params.id);

    if (!brand) {
      return notFound('Brand not found');
    }

    return ok({
      brand: {
        ...brand,
        denominationRule: getGiftDenominationRule(brand)
      }
    });
  } catch (error) {
    return serverError(error);
  }
}
