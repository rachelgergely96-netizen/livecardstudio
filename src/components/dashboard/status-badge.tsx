import { CardStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

const toneByStatus: Record<CardStatus, string> = {
  DRAFT: 'border-amber-600 bg-amber-900/50 text-amber-300',
  PREVIEW: 'border-blue-600 bg-blue-900/50 text-blue-300',
  PAID: 'border-emerald-600 bg-emerald-900/50 text-emerald-300',
  PUBLISHED: 'border-emerald-600 bg-emerald-900/50 text-emerald-300',
  ARCHIVED: 'border-slate-600 bg-slate-800 text-slate-300'
};

const labelByStatus: Record<CardStatus, string> = {
  DRAFT: 'Draft',
  PREVIEW: 'Preview',
  PAID: 'Paid',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived'
};

export function StatusBadge({ status, className }: { status: CardStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
        toneByStatus[status],
        className
      )}
    >
      {labelByStatus[status]}
    </span>
  );
}

