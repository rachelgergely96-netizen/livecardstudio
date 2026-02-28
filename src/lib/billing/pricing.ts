import { CardTier, Plan } from '@prisma/client';

export const BILLING_PRICES = {
  planMonthlyCents: {
    FREE: 0,
    PREMIUM: 999,
    PRO: 1999
  } as const,
  cardCents: {
    QUICK: 500,
    PREMIUM: 1900
  } as const
};

export const BILLING_LIMITS = {
  quickItems: 1,
  freeTierItems: 4,
  paidTierItems: 12
} as const;

const PLAN_RANK: Record<Plan, number> = {
  FREE: 0,
  PREMIUM: 1,
  PRO: 2
};

export function canAccessPremiumThemes(plan: Plan) {
  return plan !== 'FREE';
}

export function canUseGiftCards(plan: Plan) {
  return plan !== 'FREE';
}

export function getCardPriceCents(plan: Plan, tier: CardTier) {
  if (plan === 'PRO') {
    return 0;
  }
  if (plan === 'FREE' && tier === 'QUICK') {
    return 0;
  }
  return tier === 'QUICK' ? BILLING_PRICES.cardCents.QUICK : BILLING_PRICES.cardCents.PREMIUM;
}

export function getPlanPriceCents(plan: Exclude<Plan, 'FREE'>) {
  return BILLING_PRICES.planMonthlyCents[plan];
}

export function getMediaItemCap(plan: Plan, tier: CardTier) {
  if (tier === 'QUICK') {
    return BILLING_LIMITS.quickItems;
  }
  return plan === 'FREE' ? BILLING_LIMITS.freeTierItems : BILLING_LIMITS.paidTierItems;
}

export function canUpgradeTo(currentPlan: Plan, targetPlan: Plan) {
  return PLAN_RANK[targetPlan] > PLAN_RANK[currentPlan];
}

