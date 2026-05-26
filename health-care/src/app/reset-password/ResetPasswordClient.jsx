"use client";

import { useRouter } from 'next/navigation';
import ResetPasswordPage from '@/views/ResetPasswordPage';

export default function ResetPasswordClient() {
  const router = useRouter();
  return <ResetPasswordPage onNavigateToLogin={() => router.push('/login')} />;
}
