import AccountPlaceholderPage from '@/views/account/AccountPlaceholderPage';

export const metadata = {
  title: 'Payment Methods - My Account',
  robots: { index: false, follow: false },
};

export default function AccountPaymentMethodsRoute() {
  return <AccountPlaceholderPage slug="payment-methods" />;
}
