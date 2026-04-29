import AdminShell from '@/components/admin/AdminShell';
import CustomersManagement from '@/components/admin/CustomersManagement';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'B2B Customers - MedCore BD Admin',
  description: 'Manage B2B customer accounts, tiers, and credit limits',
};

export default function CustomersPage() {
  return (
    <AdminShell title="B2B Customers" action="+ Add B2B account">
      <div className="p-5 px-6">
        <CustomersManagement />
      </div>
    </AdminShell>
  );
}
