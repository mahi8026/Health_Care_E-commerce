import AdminShell from '@/components/admin/AdminShell';
import WhatsAppConversationDetail from '@/components/admin/WhatsAppConversationDetail';

export const metadata = {
  title: 'Conversation Detail — WhatsApp',
  description: 'View and manage WhatsApp conversation details',
};

export default async function ConversationDetailPage({ params }) {
  // Next.js 15+ requires awaiting params
  const resolvedParams = await Promise.resolve(params);
  
  return (
    <AdminShell title="WhatsApp Conversation">
      <WhatsAppConversationDetail conversationId={resolvedParams.id} />
    </AdminShell>
  );
}
