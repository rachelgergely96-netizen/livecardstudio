'use client';

import { Plan } from '@prisma/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type UpgradePlanButtonProps = {
  targetPlan: Exclude<Plan, 'FREE'>;
  currentPlan?: Plan | null;
  className?: string;
};

export function UpgradePlanButton({ targetPlan, currentPlan, className }: UpgradePlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const alreadyOnPlan = currentPlan === targetPlan;

  async function onUpgrade() {
    try {
      setLoading(true);
      setStatus('');

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not start upgrade checkout.');
      }

      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }

      setStatus('Upgrade session created, but checkout URL is missing.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start upgrade checkout.');
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" onClick={onUpgrade} disabled={loading || alreadyOnPlan} className="w-full">
        {alreadyOnPlan ? 'Current Plan' : loading ? 'Redirecting...' : `Upgrade to ${targetPlan}`}
      </Button>
      {status ? <p className="mt-2 text-xs text-brand-copper">{status}</p> : null}
    </div>
  );
}

