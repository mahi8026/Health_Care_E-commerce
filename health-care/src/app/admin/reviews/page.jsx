'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const ReviewsManagement = dynamic(
  () => import('@/components/admin/ReviewsManagement'),
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

export default function AdminReviewsPage() {
  return (
    <AdminShell title="Reviews Management" action="Export reviews">
      <div className="p-5 px-6">
        <Suspense fallback={(
          <div className="p-5 px-6 animate-pulse space-y-4">
          <div className="h-10 bg-[var(--color-background-muted)] rounded w-full" />
          <div className="h-64 bg-[var(--color-background-muted)] rounded w-full" />
          </div>
        )}>
          <ReviewsManagement />
        </Suspense>
      </div>
    </AdminShell>
  );
}
