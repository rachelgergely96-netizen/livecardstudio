import Link from 'next/link';
import { ArrowRight, Camera, Palette, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { label: 'Add photos', icon: Camera },
  { label: 'Pick a theme', icon: Palette },
  { label: 'Share the link', icon: Send }
] as const;

export function OnboardingBanner() {
  return (
    <section className="card-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-label">Start here</p>
          <h2 className="section-title text-3xl">Build your first living card</h2>
          <p className="serif-copy mt-1 text-xl text-brand-body">
            Three quick steps from idea to a shareable experience.
          </p>
        </div>
        <Link href="/create">
          <Button className="whitespace-nowrap">Start Creating</Button>
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(200,160,120,0.28)] bg-[#fffaf4] px-3 py-2">
                <Icon className="h-4 w-4 text-brand-copper" />
                <span className="text-sm text-brand-charcoal">{step.label}</span>
              </div>
              {index < steps.length - 1 ? <ArrowRight className="h-4 w-4 text-brand-muted" /> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

