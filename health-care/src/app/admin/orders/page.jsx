'use client';

import dynamic from 'next/dynamic';
import AdminShell from '@/components/admin/AdminShell';

// Dynamic import — reduces initial bundle for admin orders section
const OrdersManagement = dynamic(
  () => import('@/components/admin/OrdersManagement'),
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

export default function OrdersPage() {
  return (
    <AdminShell title="Orders Management" action="Export orders">
      <div className="p-5 px-6">
        <OrdersManagement />
      </div>
    </AdminShell>
  );
}
