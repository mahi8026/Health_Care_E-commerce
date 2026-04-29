import AdminShell from '@/components/admin/AdminShell';
import SystemMonitoring from '@/components/admin/SystemMonitoring';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'System Monitoring - MedCore BD Admin',
  description: 'Monitor system health, performance metrics, and server status',
};

export default function MonitoringPage() {
  return (
    <AdminShell title="System Monitoring" action="Refresh metrics">
      <div className="p-5 px-6">
        <SystemMonitoring />
      </div>
    </AdminShell>
  );
}
