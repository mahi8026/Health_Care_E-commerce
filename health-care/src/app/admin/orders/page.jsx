import AdminShell from '@/components/admin/AdminShell';
import OrdersManagement from '@/components/admin/OrdersManagement';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Orders Management - MedCore BD Admin',
  description: 'Manage customer orders, update statuses, and send notifications',
};

export default function OrdersPage() {
  return (
    <AdminShell title="Orders Management" action="Export orders">
      <div className="p-5 px-6">
        <OrdersManagement />
      </div>
    </AdminShell>
  );
}
