import AccountPage from '@/views/AccountPage';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: 'My Account | MediportBD',
  description: 'Manage your MediportBD account, orders, wishlist, and preferences.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/account` },
};

export default function Account() {
  return <AccountPage />;
}
