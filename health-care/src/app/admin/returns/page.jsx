import AdminShell from '@/components/admin/AdminShell';
import ReturnsManagement from '@/components/admin/ReturnsManagement';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Returns Management - MedCore BD Admin',
  description: 'Review and process customer return requests',
};

export default function ReturnsPage() {
  return (
    <AdminShell title="Returns Management" action="Export returns">
      <div className="p-5 px-6">
        <ReturnsManagement />
      </div>
    </AdminShell>
  );
}
