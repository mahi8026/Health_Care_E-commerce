import AccountPlaceholderPage from '@/views/account/AccountPlaceholderPage';

export const metadata = {
  title: 'Notifications - My Account',
  robots: { index: false, follow: false },
};

export default function AccountNotificationsRoute() {
  return <AccountPlaceholderPage slug="notifications" />;
}
