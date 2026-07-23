"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  // Protect admin routes
  useEffect(() => {
    // Wait for auth context to finish loading
    if (loading) {
      return;
    }

    // Check authentication after loading is complete using async IIFE
    (async () => {
      setIsChecking(false);

      if (!isAuthenticated()) {
        router.push('/login?redirect=/admin');
      } else if (user?.role !== 'admin') {
        router.push('/');
      }
    })();
  }, [loading, isAuthenticated, user, router]);

  // Show loading while checking auth
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-muted">
        <div className="text-center">
          <div className="text-[14px] text-[var(--color-text-secondary)]">
            Loading admin panel...
          </div>
        </div>
      </div>
    );
  }

  // Don't render admin content if not authenticated or not admin
  if (!isAuthenticated() || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-page-muted">
      {children}
    </div>
  );
}
