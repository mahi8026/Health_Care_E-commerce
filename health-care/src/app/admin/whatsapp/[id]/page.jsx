import AdminShell from '@/components/admin/AdminShell';
import WhatsAppConversationDetail from '@/components/admin/WhatsAppConversationDetail';

export const metadata = {
  title: 'Conversation Detail — WhatsApp | MediportBD',
  description: 'View and manage WhatsApp conversation details',
};

export default function ConversationDetailPage({ params }) {
  return (
    <AdminShell title="WhatsApp Conversation">
      <WhatsAppConversationDetail conversationId={params.id} />
    </AdminShell>
  );
}
