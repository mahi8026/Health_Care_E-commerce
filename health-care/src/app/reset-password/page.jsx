"use client";

import { useRouter } from 'next/navigation';
import ResetPasswordPage from '@/views/ResetPasswordPage';

export default function ResetPassword() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

  return <ResetPasswordPage onNavigateToLogin={handleNavigateToLogin} />;
}
