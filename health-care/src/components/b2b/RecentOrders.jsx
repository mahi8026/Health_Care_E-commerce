"use client";

import { useState } from 'react';
import api from '@/utils/api';

export default function RecentOrders({ orders = [] }) {
  const [downloading, setDownloading] = useState({});
  
  const mockOrders = orders.length > 0 ? orders : [
    { id: 'ORD-8821', date: '2025-04-10', items: 5, total: 45000, status: 'Delivered' },
    { id: 'ORD-8820', date: '2025-04-08', items: 3, total: 28500, status: 'In Transit' },
    { id: 'ORD-8819', date: '2025-04-05', items: 8, total: 67000, status: 'Processing' }
  ];

  const handleDownloadInvoice = async (orderId) => {
    setDownloading(prev => ({ ...prev, [orderId]: true }));
    try {
      const blob = await api.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Failed to download invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
      <h3 className="text-[14px] font-semibold mb-3">Recent Orders</h3>
      <div className="space-y-2">
        {mockOrders.map((order) => (
          <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg">
            <div className="flex-1">
              <div className="text-[12px] font-medium">{order.id}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">{order.date} • {order.items} items</div>
            </div>
            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2">
              <div>
                <div className="text-[12px] font-bold">৳{order.total.toLocaleString()}</div>
                <div className="text-[10px] text-[#0E8A6E]">{order.status}</div>
              </div>
              <button
                onClick={() => handleDownloadInvoice(order.id)}
                disabled={downloading[order.id]}
                className="text-[10px] text-[#0E8A6E] hover:underline disabled:opacity-50 px-2 py-1 min-h-[32px] flex items-center gap-1"
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
