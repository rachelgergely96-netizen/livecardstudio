import { env } from '@/lib/env';

const TREMENDOUS_BASE = (env.TREMENDOUS_BASE_URL || 'https://testflight.tremendous.com/api/v2').replace(/\/$/, '');

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

export async function fetchGiftBrands() {
  const data = await tremendousRequest<{ products: TremendousProduct[] }>('/products');
  return data.products || [];
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
