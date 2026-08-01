'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const ReturnsManagement = dynamic(
  () => import('@/components/admin/ReturnsManagement'),
  {
    ssr: false,
    loading: () => (
      <div className="p-5 px-6 animate-pulse space-y-4">
        <div className="h-10 bg-[var(--color-background-muted)] rounded w-full" />
        <div className="h-64 bg-[var(--color-background-muted)] rounded w-full" />
      </div>
    ),
  }
);

export default function ReturnsPage() {
  return (
    <AdminShell title="Returns Management" action="Export returns">
      <div className="w-full max-w-full overflow-hidden">
        <Suspense fallback={(
          <div className="p-5 px-6 animate-pulse space-y-4">
          <div className="h-10 bg-[var(--color-background-muted)] rounded w-full" />
          <div className="h-64 bg-[var(--color-background-muted)] rounded w-full" />
          </div>
        )}>
          <ReturnsManagement />
        </Suspense>
      </div>
    </AdminShell>
  );
}
