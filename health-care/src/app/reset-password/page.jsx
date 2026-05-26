import { SITE_CONFIG } from '@/config/seo';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata = {
  title: 'Reset Password | MedCore BD',
  description: 'Set a new password for your MedCore BD account.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/reset-password` },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
