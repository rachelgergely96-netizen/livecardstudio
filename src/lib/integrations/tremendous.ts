import { env } from '@/lib/env';

const TREMENDOUS_BASE = (env.TREMENDOUS_BASE_URL || 'https://testflight.tremendous.com/api/v2').replace(/\/$/, '');
const PRODUCT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type TremendousRequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
};

async function tremendousRequest<T>(path: string, options: TremendousRequestOptions = {}) {
  if (!env.TREMENDOUS_API_KEY) {
    throw new Error('TREMENDOUS_API_KEY is missing');
  }

  const response = await fetch(`${TREMENDOUS_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${env.TREMENDOUS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Tremendous API error ${response.status}: ${detail}`);
  }

  return (await response.json()) as T;
}

export type TremendousProduct = {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  category?: string;
  skus?: Array<{
    min?: number;
    max?: number;
    fixed?: number[];
    currency_code?: string;
  }>;
};

type ProductCacheState = {
  expiresAt: number;
  products: TremendousProduct[];
};

let productCache: ProductCacheState | null = null;

export async function fetchGiftBrandsFresh() {
  const data = await tremendousRequest<{ products: TremendousProduct[] }>('/products');
  return data.products || [];
}

export async function fetchGiftBrands() {
  if (productCache && Date.now() < productCache.expiresAt) {
    return productCache.products;
  }

  const products = await fetchGiftBrandsFresh();
  productCache = {
    products,
    expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS
  };
  return products;
}

export async function findGiftBrandById(productId: string) {
  const products = await fetchGiftBrands();
  return products.find((product) => product.id === productId) || null;
}

export type GiftDenominationRule = {
  fixedValuesUsd: number[];
  minUsd: number | null;
  maxUsd: number | null;
};

function toRoundedCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function getGiftDenominationRule(product: TremendousProduct): GiftDenominationRule {
  const usdSkus = (product.skus || []).filter((sku) => !sku.currency_code || sku.currency_code === 'USD');

  const fixedValuesUsd = usdSkus
    .flatMap((sku) => sku.fixed || [])
    .map((value) => toRoundedCurrency(Number(value)))
    .filter((value, index, all) => !isNaN(value) && all.indexOf(value) === index)
    .sort((a, b) => a - b);

  const mins = usdSkus.map((sku) => sku.min).filter((value): value is number => typeof value === 'number');
  const maxes = usdSkus.map((sku) => sku.max).filter((value): value is number => typeof value === 'number');

  return {
    fixedValuesUsd,
    minUsd: mins.length ? Math.min(...mins) : null,
    maxUsd: maxes.length ? Math.max(...maxes) : null
  };
}

export function isGiftDenominationAllowed(product: TremendousProduct, denominationUsd: number) {
  const target = toRoundedCurrency(denominationUsd);
  const rule = getGiftDenominationRule(product);

  if (rule.fixedValuesUsd.length) {
    return rule.fixedValuesUsd.some((value) => Math.abs(value - target) < 0.001);
  }

  if (rule.minUsd !== null && target < rule.minUsd) {
    return false;
  }

  if (rule.maxUsd !== null && target > rule.maxUsd) {
    return false;
  }

  // If Tremendous does not return usable denomination constraints, allow and let API enforce.
  return true;
}

export type PurchaseGiftInput = {
  productId: string;
  recipientName: string;
  denominationUsd: number;
};

export async function purchaseGiftCard(input: PurchaseGiftInput) {
  if (!env.TREMENDOUS_FUNDING_SOURCE_ID) {
    throw new Error('TREMENDOUS_FUNDING_SOURCE_ID is missing');
  }

  const payload = {
    payment: {
      funding_source_id: env.TREMENDOUS_FUNDING_SOURCE_ID
    },
    rewards: [
      {
        value: {
          denomination: input.denominationUsd,
          currency_code: 'USD'
        },
        delivery: {
          method: 'LINK'
        },
        recipient: {
          name: input.recipientName,
          email: null
        },
        products: [input.productId]
      }
    ]
  };

  const data = await tremendousRequest<{
    order: { id: string };
    rewards: Array<{ delivery?: { link?: string; credential?: string } }>;
  }>('/orders', {
    method: 'POST',
    body: payload
  });

  const reward = data.rewards?.[0];
  return {
    orderId: data.order?.id,
    redemptionUrl: reward?.delivery?.link,
    redemptionCode: reward?.delivery?.credential
  };
}
