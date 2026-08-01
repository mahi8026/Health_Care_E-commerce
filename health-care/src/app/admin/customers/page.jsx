'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const CustomersManagement = dynamic(
  () => import('@/components/admin/CustomersManagement'),
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

export default function CustomersPage() {
  return (
    <AdminShell title="Customer Management" action="+ Add Customer">
      <div className="max-w-full overflow-hidden">
        <Suspense fallback={(
          <div className="p-5 px-6 animate-pulse space-y-4">
          <div className="h-10 bg-[var(--color-background-muted)] rounded w-full" />
          <div className="h-64 bg-[var(--color-background-muted)] rounded w-full" />
          </div>
        )}>
          <CustomersManagement />
        </Suspense>
      </div>
    </AdminShell>
  );
}
