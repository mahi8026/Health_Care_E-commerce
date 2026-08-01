'use client';

import { useState, useEffect } from 'react';
import NewsletterManagement from '@/components/admin/NewsletterManagement';
import AdminShell from '@/components/admin/AdminShell';

export default function NewsletterPage() {
  return (
    <AdminShell title="Newsletter Management">
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
          Newsletter Management
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Manage subscribers and send broadcast emails
        </p>
      </div>

      <NewsletterManagement />
    </div>
    </AdminShell>
  );
}
