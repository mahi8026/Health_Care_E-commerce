import PaymentMethodsPage from '@/views/account/PaymentMethodsPage';

export const metadata = {
  title: 'Payment Methods - My Account',
  robots: { index: false, follow: false },
};

export default function AccountPaymentMethodsRoute() {
  return <PaymentMethodsPage />;
}
