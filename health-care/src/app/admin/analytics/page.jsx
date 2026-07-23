import AdminShell from '@/components/admin/AdminShell';
import AnalyticsReports from '@/components/admin/AnalyticsReports';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics & Reports - MediportBD Admin',
  description: 'View sales analytics, revenue reports, and business insights',
};

export default function AnalyticsPage() {
  return (
    <AdminShell title="Analytics & Reports" action="Export report">
      <div className="p-5 px-6">
        <AnalyticsReports />
      </div>
    </AdminShell>
  );
}
