import ChatDashboard from '@/components/admin/chat/ChatDashboard';

export const metadata = {
  title: 'Live Chat Dashboard',
  description: 'Manage customer conversations in real-time',
};

export default function AdminChatPage() {
  return <ChatDashboard />;
}
