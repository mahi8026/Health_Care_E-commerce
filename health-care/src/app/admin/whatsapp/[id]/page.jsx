import WhatsAppConversationDetail from '@/components/admin/WhatsAppConversationDetail';

export const metadata = {
  title: 'Conversation Detail — WhatsApp | MedCore BD',
  description: 'View and manage WhatsApp conversation details',
};

export default function ConversationDetailPage({ params }) {
  return <WhatsAppConversationDetail conversationId={params.id} />;
}
