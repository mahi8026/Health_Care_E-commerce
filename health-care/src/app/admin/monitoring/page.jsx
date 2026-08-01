'use client';

import dynamic from 'next/dynamic';
import AdminShell from '@/components/admin/AdminShell';

const SystemMonitoring = dynamic(
  () => import('@/components/admin/SystemMonitoring'),
  {
    ssr: false,
    loading: () => (
      <div className="p-5 px-6 animate-pulse space-y-4">
        <div className="h-10 bg-[var(--color-background-muted)] rounded w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[var(--color-background-muted)] rounded" />)}
        </div>
        <div className="h-64 bg-[var(--color-background-muted)] rounded w-full" />
      </div>
    ),
  }
);

export default function MonitoringPage() {
  return (
    <AdminShell title="System Monitoring">
      <SystemMonitoring />
    </AdminShell>
  );
}
