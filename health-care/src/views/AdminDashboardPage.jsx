"use client";

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';
import AdminTabs from '@/components/admin/AdminTabs';
import DashboardOverview from '@/components/admin/DashboardOverview';
import OrdersManagement from '@/components/admin/OrdersManagement';
import ProductsManagement from '@/components/admin/ProductsManagement';
import CustomersManagement from '@/components/admin/CustomersManagement';
import QuotationsManagement from '@/components/admin/QuotationsManagement';
import AnalyticsReports from '@/components/admin/AnalyticsReports';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const adminUser = {
    name: 'Shahid Admin',
    role: 'Super Administrator',
    initials: 'SA',
    isOnline: true
  };

  const tabConfig = {
    dashboard: { title: 'Dashboard', action: '+ Add product' },
    orders: { title: 'Orders Management', action: 'Export orders' },
    products: { title: 'Product Catalogue', action: '+ Add product' },
    customers: { title: 'B2B Customers', action: '+ Add B2B account' },
    quotes: { title: 'Quotation Requests', action: '+ New quotation' },
    analytics: { title: 'Analytics & Reports', action: 'Export report' }
  };

  return (
    <div className="grid grid-cols-[220px_1fr] min-h-screen bg-[var(--color-background-tertiary)]">
      <h2 className="absolute w-px h-px overflow-hidden clip-[rect(0,0,0,0)]">
        MedCore BD Admin Panel — full dashboard with orders, products, customers and analytics
      </h2>

      {/* Sidebar */}
      <AdminSidebar 
        user={adminUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Content */}
      <div className="flex flex-col overflow-hidden">
        <AdminTopBar 
          title={tabConfig[activeTab].title}
          action={tabConfig[activeTab].action}
        />
        
        <AdminTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* Content Area */}
        <div className="p-5 px-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
          {activeTab === 'orders' && <OrdersManagement />}
          {activeTab === 'products' && <ProductsManagement />}
          {activeTab === 'customers' && <CustomersManagement />}
          {activeTab === 'quotes' && <QuotationsManagement />}
          {activeTab === 'analytics' && <AnalyticsReports />}
        </div>
      </div>
    </div>
  );
}
