"use client";

import { showToast } from '@/components/ui/Toast';

import { useState } from 'react';
import api from '@/utils/api';

export default function RecentOrders({ orders = [] }) {
  const [downloading, setDownloading] = useState({});
  
  const mockOrders = orders.length > 0 ? orders : [
    { id: 'ORD-8821', date: '2025-04-10', items: 5, total: 45000, status: 'Delivered' },
    { id: 'ORD-8820', date: '2025-04-08', items: 3, total: 28500, status: 'In Transit' },
    { id: 'ORD-8819', date: '2025-04-05', items: 8, total: 67000, status: 'Processing' }
  ];

  const handleDownloadInvoice = (orderId) => {
    window.open(`/orders/${orderId}/invoice`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
      <h3 className="text-sm font-semibold mb-3">Recent Orders</h3>
      <div className="space-y-2">
        {mockOrders.map((order) => (
          <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg">
            <div className="flex-1">
              <div className="text-xs font-medium">{order.id}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">{order.date} • {order.items} items</div>
            </div>
            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2">
              <div>
                <div className="text-xs font-semibold">৳{order.total.toLocaleString()}</div>
                <div className="text-xs text-brand-teal">{order.status}</div>
              </div>
              <button
                onClick={() => handleDownloadInvoice(order.id)}
                disabled={downloading[order.id]}
                className="text-xs text-brand-teal hover:underline disabled:opacity-50 px-2 py-1 min-h-[32px] flex items-center gap-1"
              >
                {downloading[order.id] ? 'Downloading...' : '📄 Invoice'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
