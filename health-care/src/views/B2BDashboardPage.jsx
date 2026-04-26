"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/b2b/Sidebar';
import DashboardHeader from '@/components/b2b/DashboardHeader';
import KPIGrid from '@/components/b2b/KPIGrid';
import QuickActions from '@/components/b2b/QuickActions';
import RecentOrders from '@/components/b2b/RecentOrders';
import AccountManager from '@/components/b2b/AccountManager';
import CreditPanel from '@/components/b2b/CreditPanel';
import RecentQuotations from '@/components/b2b/RecentQuotations';
import DashboardSkeleton from '@/components/admin/DashboardSkeleton';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function B2BDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchB2BData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('medcore_token');
        const headers = { Authorization: `Bearer ${token}` };

        const [ordersRes, quotesRes, profileRes] = await Promise.all([
          fetch(`${API}/api/orders?limit=10`, { headers }),
          fetch(`${API}/api/quotes?limit=5`, { headers }),
          fetch(`${API}/api/auth/me`, { headers }),
        ]);

        const [ordersData, quotesData, profileData] = await Promise.all([
          ordersRes.json(),
          quotesRes.json(),
          profileRes.json(),
        ]);

        const profile = profileData.data || profileData.user || {};
        const orders = ordersData.data?.orders || ordersData.orders || [];
        const quotes = quotesData.data?.quotes || quotesData.quotes || [];

        setDashboardData({
          name: profile.companyName || profile.name || user.name || 'Your Account',
          accountId: profile.accountId || `B2B-${String(profile._id || '').slice(-5).toUpperCase()}`,
          tier: profile.tier || 'Standard',
          discount: profile.discountPct || 0,
          totalSpend: ordersData.data?.totalSpend || 0,
          activeOrders: ordersData.data?.activeCount || orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
          ordersInDelivery: orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length,
          creditUsed: profile.creditUsed || 0,
          creditLimit: profile.creditLimit || 0,
          loyaltyPoints: profile.loyaltyPoints || 0,
          recentOrders: orders,
          recentQuotes: quotes,
        });
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchB2BData();
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[13px] text-[#E24B4A]">
        {error}
      </div>
    );
  }

  const accountData = dashboardData || {
    name: user?.name || 'Your Account',
    accountId: '—',
    tier: 'Standard',
    discount: 0,
    totalSpend: 0,
    activeOrders: 0,
    ordersInDelivery: 0,
    creditUsed: 0,
    creditLimit: 0,
    loyaltyPoints: 0,
  };

  return (
    <div className="grid grid-cols-[220px_1fr]">
      <Sidebar accountData={accountData} />

      <div className="p-5 px-6 bg-[var(--color-background-tertiary)]">
        <DashboardHeader accountData={accountData} />

        <KPIGrid accountData={accountData} />

        <QuickActions />

        <div className="grid grid-cols-[1fr_280px] gap-3 mb-5">
          <RecentOrders orders={dashboardData?.recentOrders} />

          <div>
            <AccountManager />
            <CreditPanel accountData={accountData} />
          </div>
        </div>

        <RecentQuotations quotes={dashboardData?.recentQuotes} />
      </div>
    </div>
  );
}
