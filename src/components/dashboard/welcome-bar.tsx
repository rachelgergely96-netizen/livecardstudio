import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WelcomeBarProps = {
  name: string;
  totalCards: number;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function WelcomeBar({ name, totalCards }: WelcomeBarProps) {
  const subtitle =
    totalCards > 0
      ? `You have ${totalCards.toLocaleString()} cards in your studio.`
      : 'Your studio is ready for its first card.';

  return (
    <section className="card-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="ui-label">Dashboard</p>
        <h1 className="section-title text-3xl">
          {getGreeting()}, {name}
        </h1>
        <p className="serif-copy mt-1 text-xl text-brand-body">{subtitle}</p>
      </div>
      <Link href="/create">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Card
        </Button>
      </Link>
    </section>
  );
}

