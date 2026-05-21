import AdminShell from '@/components/admin/AdminShell';
import SystemMonitoring from '@/components/admin/SystemMonitoring';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'System Monitoring - MedCore BD Admin',
  description: 'Monitor system health, performance metrics, and server status',
};

export default function MonitoringPage() {
  return (
    <AdminShell title="System Monitoring">
      <SystemMonitoring />
    </AdminShell>
  );
}
