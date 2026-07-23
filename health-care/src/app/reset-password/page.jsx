import { SITE_CONFIG } from '@/config/seo';
import ResetPasswordPage from '@/views/ResetPasswordPage';

export const metadata = {
  title: 'Reset Password | MediportBD',
  description: 'Set a new password for your MediportBD account.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/reset-password` },
};

export default function ResetPassword() {
  return <ResetPasswordPage />;
}
