import AddressesPage from '@/views/account/AddressesPage';

export const metadata = {
  title: 'Addresses - My Account',
  description: 'Manage your delivery addresses',
  robots: { index: false, follow: false },
};

export default function AccountAddressesRoute() {
  return <AddressesPage />;
}
