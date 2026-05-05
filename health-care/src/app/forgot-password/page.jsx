"use client";

import { useRouter } from 'next/navigation';
import ForgotPasswordPage from '@/views/ForgotPasswordPage';

export default function ForgotPassword() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

  return <ForgotPasswordPage onNavigateToLogin={handleNavigateToLogin} />;
}
