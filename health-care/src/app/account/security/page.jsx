import SecurityPage from '@/views/account/SecurityPage';

export const metadata = {
  title: 'Security - My Account',
  description: 'Password and account security settings',
  robots: { index: false, follow: false },
};

export default function AccountSecurityRoute() {
  return <SecurityPage />;
}
