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
        const orderUrl = `${apiUrl}/orders/${orderId}`;
        
        console.log('🔗 Fetching order from:', orderUrl);
        
        // Fetch order details
        const response = await fetch(orderUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        console.log('📦 Raw API Response:', data);
        
        // Handle both single order and orders array response
        let orderData;
        if (data.order) {
          // Single order response: { success: true, order: {...} }
          orderData = data.order;
        } else if (data.orders && Array.isArray(data.orders)) {
          // Orders list response: { success: true, orders: [{...}] }
          // Find the specific order by ID
          orderData = data.orders.find(o => o._id === orderId || o.orderNumber === orderId);
          if (!orderData) {
            throw new Error('Order not found in response');
          }
        } else if (data._id) {
          // Direct order object response: { _id: "...", orderNumber: "...", ... }
          orderData = data;
        } else {
          throw new Error('Invalid response format');
        }
        
        // Debug: Log the order data
        console.log('📦 Order Data:', orderData);
        console.log('👤 User in Order:', orderData.user);
        console.log('📋 Order Items:', orderData.items);
        console.log('🏠 Delivery Address:', orderData.deliveryAddress);
        
        // Ensure legacy field mapping
        if (!orderData.orderNumber && orderData.orderId) {
          orderData.orderNumber = orderData.orderId;
        }
        if (!orderData.totalAmount && orderData.total) {
          orderData.totalAmount = orderData.total;
        }
        
        // Fetch user details if user is populated as ID only
        let userData = orderData.user;
        if (userData && typeof userData === 'string') {
          // User is just an ID, fetch full user details
          try {
            const userResponse = await fetch(`${apiUrl}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (userResponse.ok) {
              const userJson = await userResponse.json();
              userData = userJson.user || userJson;
            }
          } catch (err) {
            console.warn('Could not fetch user details:', err);
          }
        }
        
        setOrder(orderData);
        setUser(userData || {});
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
