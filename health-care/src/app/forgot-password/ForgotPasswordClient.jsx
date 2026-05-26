"use client";

import { useRouter } from 'next/navigation';
import ForgotPasswordPage from '@/views/ForgotPasswordPage';

export default function ForgotPasswordClient() {
  const router = useRouter();
  return <ForgotPasswordPage onNavigateToLogin={() => router.push('/login')} />;
}
