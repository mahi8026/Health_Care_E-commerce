"use client";

import OrderHistoryPage from '@/views/OrderHistoryPage';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();

  const handleNavigate = (view, params) => {
    const routes = {
      'track': `/track${params?.orderNumber ? `?order=${params.orderNumber}` : ''}`,
      'return-request': `/returns/request/${params?.orderId || ''}`,
      'reagent': '/reagent-store',
      'home': '/',
    };
    
    const route = routes[view] || '/';
    router.push(route);
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <OrderHistoryPage 
      onNavigate={handleNavigate}
      onLoginClick={handleLoginClick}
    />
  );
}
