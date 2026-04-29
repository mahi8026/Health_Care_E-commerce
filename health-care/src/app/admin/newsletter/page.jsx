'use client';

import { useState, useEffect } from 'react';
import NewsletterManagement from '@/components/admin/NewsletterManagement';

export default function NewsletterPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)] mb-2 font-[family-name:var(--font-lora)]">
          Newsletter Management
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Manage subscribers and send broadcast emails
        </p>
      </div>

      <NewsletterManagement />
    </div>
  );
}
