"use client";

import AdminShell from '@/components/admin/AdminShell';
import BannersManagement from '@/components/admin/BannersManagement';

export default function BannersPage() {
  return (
    <AdminShell title="Banner Management">
      <div className="p-5 px-6">
        <BannersManagement />
      </div>
    </AdminShell>
  );
}
