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
      <div className="w-full max-w-full overflow-hidden">
        <ReturnsManagement />
      </div>
    </AdminShell>
  );
}
