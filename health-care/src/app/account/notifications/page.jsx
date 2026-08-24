// Account settings page — never indexed (private, behind auth)
import NotificationSettingsClient from './NotificationSettingsClient';

export const metadata = {
  title: 'Notification Settings',
  robots: { index: false, follow: false },
};

export default function NotificationSettingsPage() {
  return <NotificationSettingsClient />;
}
