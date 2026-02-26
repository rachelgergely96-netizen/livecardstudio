import { ReactNode } from 'react';
import { Plan } from '@prisma/client';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';

type DashboardShellProps = {
  children: ReactNode;
  userName?: string | null;
  userPlan: Plan;
};

export function DashboardShell({ children, userName, userPlan }: DashboardShellProps) {
  return (
    <div className="min-h-screen lg:flex">
      <DashboardSidebar userName={userName} userPlan={userPlan} />
      <main className="flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pt-6">{children}</main>
    </div>
  );
}

