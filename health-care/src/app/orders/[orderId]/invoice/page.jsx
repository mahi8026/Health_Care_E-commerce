'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InvoicePage from '@/components/invoice/InvoicePage';
import '@/components/invoice/invoice-print.css';

/**
 * Invoice Page - Client-side rendered
 * Dynamic route: /orders/[orderId]/invoice
 */
export default function Invoice() {
  const params = useParams();
  const router = useRouter();
  const { orderId } = params;
  
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const token = localStorage.getItem('Mediport_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${apiUrl}/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        const orderData = data.order || data;
        
        setOrder(orderData);
        setUser(orderData.user || {});
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-teal border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl">📄</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Invoice Not Found</h1>
          <p className="mb-6 text-gray-600">
            {error || 'The invoice you are looking for does not exist or you do not have permission to view it.'}
          </p>
          <button
            onClick={() => router.push('/orders')}
            className="rounded-lg bg-brand-navy px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-navy-deep"
          >
            Go to Orders
          </button>
        </div>
      </div>
    );
  }

  return <InvoicePage order={order} user={user} />;
}
