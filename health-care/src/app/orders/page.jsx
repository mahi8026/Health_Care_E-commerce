import { SITE_CONFIG } from '@/config/seo';
import OrdersClient from './OrdersClient';

export const metadata = {
  title: 'My Orders | MediportBD',
  description: 'View and manage your medical equipment orders on MediportBD.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/orders` },
};

export default function OrdersPage() {
  return <OrdersClient />;
}
