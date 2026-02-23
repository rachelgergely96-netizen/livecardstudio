import { notFound, ok, serverError } from '@/lib/api';
import { env } from '@/lib/env';
import { fallbackGiftBrands } from '@/lib/integrations/gift-fallback';
import { fetchGiftBrands } from '@/lib/integrations/tremendous';

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const brands = env.TREMENDOUS_API_KEY ? await fetchGiftBrands() : fallbackGiftBrands;
    const brand = brands.find((item) => item.id === context.params.id);

    if (!brand) {
      return notFound('Brand not found');
    }

    return ok({ brand });
  } catch (error) {
    return serverError(error);
  }
}
