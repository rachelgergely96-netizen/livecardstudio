import { CardStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

const toneByStatus: Record<CardStatus, string> = {
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-700',
  PREVIEW: 'border-blue-200 bg-blue-50 text-blue-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PUBLISHED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ARCHIVED: 'border-slate-200 bg-slate-100 text-slate-600'
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

