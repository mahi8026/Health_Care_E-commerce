import AdminShell from '@/components/admin/AdminShell';
import WhatsAppAnalytics from '@/components/admin/WhatsAppAnalytics';

export const metadata = {
  title: 'WhatsApp Analytics — Admin',
  description: 'View WhatsApp conversation analytics and metrics',
};

export default function WhatsAppAnalyticsPage() {
  return (
    <AdminShell title="WhatsApp Analytics">
      <WhatsAppAnalytics />
    </AdminShell>
  );
}
