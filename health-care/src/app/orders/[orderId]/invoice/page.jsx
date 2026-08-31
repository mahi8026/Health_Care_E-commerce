import { notFound } from 'next/navigation';
import InvoicePage from '@/components/invoice/InvoicePage';
import '@/components/invoice/invoice-print.css';

/**
 * Fetch order data from API
 */
async function getOrder(orderId) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/orders/${orderId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.order || data;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Invoice Page
 * Dynamic route: /orders/[orderId]/invoice
 */
export default async function Invoice({ params }) {
  const { orderId } = params;

  // Fetch order data
  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  // Extract user data from order
  const user = order.user || {};

  return <InvoicePage order={order} user={user} />;
}

/**
 * Metadata for invoice page
 */
export async function generateMetadata({ params }) {
  const { orderId } = params;
  
  return {
    title: `Invoice - Order ${orderId} | MediportBD`,
    description: 'View and download your invoice from MediportBD',
    robots: {
      index: false,
      follow: false,
    },
  };
}
