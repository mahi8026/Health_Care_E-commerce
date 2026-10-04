import AdminShell from '@/components/admin/AdminShell';
import LeadsManagement from '@/components/admin/LeadsManagement';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'CRM Leads - MediportBD Admin',
  description: 'B2B lead pipeline: qualification, RFQ linkage and attribution',
};

export default function LeadsPage() {
  return (
    <AdminShell title="CRM Leads">
      <div className="p-5 px-6">
        <LeadsManagement />
      </div>
    </AdminShell>
  );
}
