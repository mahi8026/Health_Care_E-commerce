'use client';

import { useParams } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import InvoiceEditor from '@/components/admin/InvoiceEditor';

/**
 * Admin → Orders → Invoice editor.
 * Route: /admin/orders/[orderId]/invoice
 */
export default function AdminInvoicePage() {
  const params = useParams();
  const orderId = params?.orderId;

  return (
    <AdminShell title="Edit Invoice">
      <div className="p-5 px-6">
        <InvoiceEditor orderId={orderId} />
      </div>
    </AdminShell>
  );
}
