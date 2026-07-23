import AdminShell from '@/components/admin/AdminShell';
import ChatDashboard from '@/components/admin/chat/ChatDashboard';

export const metadata = {
  title: 'Live Chat — Admin | MediportBD',
  description: 'Manage customer live chat conversations in real-time',
};

export default function AdminChatPage() {
  return (
    <AdminShell title="Live Chat">
      <ChatDashboard />
    </AdminShell>
  );
}
