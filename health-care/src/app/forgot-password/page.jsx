import { SITE_CONFIG } from '@/config/seo';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata = {
  title: 'Forgot Password | MediportBD',
  description: 'Reset your MediportBD account password.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/forgot-password` },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
