import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import AdminShell from '@/components/admin/AdminShell';
import DashboardOverview from '@/components/admin/DashboardOverview';

export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata(pageMetadata.admin);

export default function AdminDashboard() {
  return (
    <AdminShell title="Dashboard">
      <div className="p-5 px-6">
        <DashboardOverview />
      </div>
    </AdminShell>
  );
}
