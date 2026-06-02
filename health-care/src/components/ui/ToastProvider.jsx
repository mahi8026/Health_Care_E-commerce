'use client';

import { useToast, ToastContainer } from './Toast';

/**
 * Toast Provider - Add to root layout
 * 
 * Usage in layout.jsx:
 * import ToastProvider from '@/components/ui/ToastProvider';
 * <ToastProvider />
 */

export default function ToastProvider() {
  const { toasts, removeToast } = useToast();

  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
}
