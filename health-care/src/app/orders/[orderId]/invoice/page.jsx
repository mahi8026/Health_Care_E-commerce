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
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Prefer the dedicated invoice endpoint — it populates the user profile
        // (addresses, accountType, b2bAccount, paymentTerms) and product brands.
        // Fall back to the regular order endpoint for compatibility.
        let response = await fetch(`${apiUrl}/orders/${orderId}/invoice`, { headers });
        if (!response.ok) {
          response = await fetch(`${apiUrl}/orders/${orderId}`, { headers });
        }
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();

        // Handle multiple response formats
        let orderData;
        if (data.data && data.data.order) {
          // Nested format: { success: true, data: { order: {...} } }
          orderData = data.data.order;
        } else if (data.order) {
          // Direct format: { success: true, order: {...} }
          orderData = data.order;
        } else if (data.orders && Array.isArray(data.orders)) {
          // Orders list response: { success: true, orders: [{...}] }
          orderData = data.orders.find(o => o._id === orderId || o.orderNumber === orderId);
          if (!orderData) {
            throw new Error('Order not found in response');
          }
        } else if (data._id) {
          // Direct order object response
          orderData = data;
        } else {
          throw new Error('Invalid response format');
        }

        // Ensure legacy field mapping
        if (!orderData.orderNumber && orderData.orderId) {
          orderData.orderNumber = orderData.orderId;
        }
        if (!orderData.totalAmount && orderData.total) {
          orderData.totalAmount = orderData.total;
        }
        if (!orderData.deliveryAddress && orderData.shippingAddress) {
          orderData.deliveryAddress = orderData.shippingAddress;
        }

        // Resolve the user payload (populated object vs raw id)
        let userData = orderData.user && typeof orderData.user === 'object' ? orderData.user : null;

        // Enrich with the full profile whenever critical billing/B2B fields are
        // missing (the generic /orders/:id endpoint only returns a few fields).
        const needsProfile =
          !userData ||
          !userData.addresses ||
          !userData.accountType ||
          userData.b2bAccount === undefined ||
          !userData.paymentTerms;
        if (needsProfile) {
          try {
            const userResponse = await fetch(`${apiUrl}/auth/me`, { headers });
            if (userResponse.ok) {
              const userJson = await userResponse.json();
              const meUser = userJson.user || userJson;
              if (meUser && (meUser._id || meUser.id)) {
                userData = { ...(userData || {}), ...meUser };
              }
            }
          } catch {
            // Best-effort — the invoice still renders with whatever is available
          }
        }

        // Last resort: use the logged-in profile as billing info
        if (!userData) {
          try {
            const userResponse = await fetch(`${apiUrl}/auth/me`, { headers });
            if (userResponse.ok) {
              const userJson = await userResponse.json();
              userData = userJson.user || userJson;
            }
          } catch {
            // ignore
          }
        }

        setOrder(orderData);
        setUser(userData || {});
      } catch (err) {
        setError(err.message || 'Failed to load invoice');
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
