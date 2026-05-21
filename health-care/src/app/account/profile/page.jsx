import ProfilePage from '@/views/account/ProfilePage';

export const metadata = {
  title: 'Profile - My Account',
  description: 'Edit your MedCore BD account profile',
  robots: { index: false, follow: false },
};

export default function AccountProfileRoute() {
  return <ProfilePage />;
}
