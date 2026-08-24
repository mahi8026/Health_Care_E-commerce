import LoyaltyPage from '@/views/account/LoyaltyPage';

export const metadata = {
  title: 'Loyalty Points',
  description: 'View your loyalty points, tier status, and transaction history',
  robots: { index: false, follow: false },
};

export default function AccountLoyaltyPage() {
  return <LoyaltyPage />;
}
