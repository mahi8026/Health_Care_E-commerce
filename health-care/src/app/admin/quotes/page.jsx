import AdminShell from '@/components/admin/AdminShell';
import QuotationsManagement from '@/components/admin/QuotationsManagement';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Quotation Requests - MediportBD Admin',
  description: 'Review and manage B2B quotation requests',
};

export default function QuotesPage() {
  return (
    <AdminShell title="Quotation Requests" action="+ New quotation">
      <div className="p-5 px-6">
        <QuotationsManagement />
      </div>
    </AdminShell>
  );
}
