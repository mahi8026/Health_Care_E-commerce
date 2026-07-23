import AdminShell from '@/components/admin/AdminShell';
import WhatsAppManagerWrapper from '@/components/admin/WhatsAppManagerWrapper';

export const metadata = {
  title: 'WhatsApp Conversations — Admin | MediportBD',
  description: 'Manage customer WhatsApp conversations and inquiries',
};

export default function WhatsAppPage() {
  return (
    <AdminShell title="WhatsApp Conversations">
      <WhatsAppManagerWrapper />
    </AdminShell>
  );
}
