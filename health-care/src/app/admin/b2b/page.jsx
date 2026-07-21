import { generatePageMetadata } from '@/utils/metadata';
import AdminShell from '@/components/admin/AdminShell';
import B2BManagement from '@/components/admin/b2b/B2BManagement';

export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata({
  title: 'B2B Management - Admin',
  description: 'Manage B2B users, approvals, and category discounts'
});

export default function B2BManagementPage() {
  return (
    <AdminShell title="B2B Management">
      <div className="p-4 md:px-5">
        <B2BManagement />
      </div>
    </AdminShell>
  );
}
