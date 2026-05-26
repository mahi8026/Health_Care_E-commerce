import NotificationsPage from '@/views/account/NotificationsPage';

export const metadata = {
  title: 'Notification Preferences - My Account',
  robots: { index: false, follow: false },
};

export default function AccountNotificationsRoute() {
  return <NotificationsPage />;
}
