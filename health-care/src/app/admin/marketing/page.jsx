'use client';

import MarketingDashboard from '@/components/admin/MarketingDashboard';
import AdminShell from '@/components/admin/AdminShell';

export default function MarketingPage() {
  return (
    <AdminShell title="Marketing Dashboard">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
            📣 Marketing Dashboard
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            WhatsApp, popup, email &amp; promo channel performance — all in one view
          </p>
        </div>

        <MarketingDashboard />
      </div>
    </AdminShell>
  );
}