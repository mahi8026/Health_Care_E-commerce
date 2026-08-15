import { SITE_CONFIG } from '@/config/seo';
import { Suspense } from 'react';
import ResetPasswordPage from '@/views/ResetPasswordPage';

export const metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your MediportBD account.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/reset-password` },
};

function LoadingFallback() {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
