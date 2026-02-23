import Stripe from 'stripe';
import { env } from '@/lib/env';

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil'
    })
  : null;

export function ensureStripe() {
  if (!stripe) {
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY.');
  }
  return stripe;
}

