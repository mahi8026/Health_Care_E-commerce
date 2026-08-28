import OrderTrackingPage from '@/views/OrderTrackingPage';

export const metadata = {
  title: 'Track Order | MediportBD',
  description: 'Track your MediportBD order status and delivery progress.',
  robots: { index: false, follow: false },
};

export default async function TrackOrderPage({ params }) {
  const { orderNumber } = await params;
  return <OrderTrackingPage orderNumber={orderNumber} />;
}
