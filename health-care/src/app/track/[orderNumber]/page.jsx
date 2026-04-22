import OrderTrackingPage from '@/views/OrderTrackingPage';

export const metadata = {
  title: 'Track Order — MedCore BD',
  description: 'Track your order status and delivery progress in real-time'
};

export default function TrackOrderPage({ params }) {
  return <OrderTrackingPage orderNumber={params.orderNumber} />;
}
