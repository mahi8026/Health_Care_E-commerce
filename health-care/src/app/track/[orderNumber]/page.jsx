import OrderTrackingPage from '@/views/OrderTrackingPage';

export const metadata = {
  title: 'Track Order — MediportBD',
  description: 'Track your order status and delivery progress in real-time'
};

export default async function TrackOrderPage({ params }) {
  const { orderNumber } = await params;
  return <OrderTrackingPage orderNumber={orderNumber} />;
}
