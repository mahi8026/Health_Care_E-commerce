'use client';

import dynamic from 'next/dynamic';
import AdminShell from '@/components/admin/AdminShell';

const CustomersManagement = dynamic(
  () => import('@/components/admin/CustomersManagement'),
  {
    ssr: false,
    loading: () => (
      <div className="p-5 px-6 animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="h-64 bg-gray-200 rounded w-full" />
      </div>
    ),
  }
);

export default function CustomersPage() {
  return (
    <AdminShell title="Customer Management" action="+ Add Customer">
      <div className="max-w-full overflow-hidden">
        <CustomersManagement />
      </div>
    </AdminShell>
  );
}
