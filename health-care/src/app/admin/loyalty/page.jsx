import AdminShell from '@/components/admin/AdminShell';
import LoyaltyManagement from '@/components/admin/LoyaltyManagement';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Loyalty Program - MedCore BD Admin',
  description: 'Manage loyalty points, tiers, and rewards',
};

export default function LoyaltyPage() {
  return (
    <AdminShell title="Loyalty Program" action="">
      <div className="max-w-full overflow-hidden">
        <LoyaltyManagement />
      </div>
    </AdminShell>
  );
}
