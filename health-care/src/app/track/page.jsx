import OrderTrackingPage from '@/views/OrderTrackingPage';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: 'Track Your Order | MediportBD',
  description: 'Track your medical equipment order status and delivery progress in real-time. Enter your order number to get live updates.',
  keywords: 'track order Bangladesh, order status MediportBD, delivery tracking',
  alternates: { canonical: `${SITE_CONFIG.url}/track` },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Track Your Order | MediportBD',
    description: 'Track your medical equipment order status and delivery progress in real-time.',
    url: `${SITE_CONFIG.url}/track`,
  },
};

export default function TrackPage() {
  return <OrderTrackingPage />;
}
