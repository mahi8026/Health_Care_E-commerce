"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';
import AdminTabs from '@/components/admin/AdminTabs';
import DashboardOverview from '@/components/admin/DashboardOverview';
import OrdersManagement from '@/components/admin/OrdersManagement';
import ProductsManagement from '@/components/admin/ProductsManagement';
import CustomersManagement from '@/components/admin/CustomersManagement';
import QuotationsManagement from '@/components/admin/QuotationsManagement';
import ReturnsManagement from '@/components/admin/ReturnsManagement';
import AnalyticsReports from '@/components/admin/AnalyticsReports';
import SystemMonitoring from '@/components/admin/SystemMonitoring';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  // Ref to trigger the create modal inside ProductsManagement from the top bar
  const openCreateProductRef = useRef(null);

  const adminUser = {
    name: user?.name || 'Admin',
    role: user?.role === 'admin' ? 'Administrator' : (user?.role || 'Administrator'),
    initials: (user?.name || 'A').charAt(0).toUpperCase(),
    isOnline: true,
  };

  const tabConfig = {
    dashboard: { title: 'Dashboard', action: '+ Add product' },
    orders: { title: 'Orders Management', action: 'Export orders' },
    products: { title: 'Product Catalogue', action: '+ Add product' },
    customers: { title: 'B2B Customers', action: '+ Add B2B account' },
    quotes: { title: 'Quotation Requests', action: '+ New quotation' },
    returns: { title: 'Returns Management', action: 'Export returns' },
    analytics: { title: 'Analytics & Reports', action: 'Export report' },
    monitoring: { title: 'System Monitoring', action: 'Refresh metrics' }
  };

  const handleTopBarAction = (action) => {
    if (action === '+ Add product') {
      // Switch to products tab first, then open the modal
      setActiveTab('products');
      // Small delay to let the tab render before triggering the modal
      setTimeout(() => openCreateProductRef.current?.(), 50);
    }
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
          onAction={handleTopBarAction}
        />
        
        <AdminTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* Content Area */}
        <div className="p-5 px-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
          {activeTab === 'orders' && <OrdersManagement />}
          {activeTab === 'products' && (
            <ProductsManagement openCreateRef={openCreateProductRef} />
          )}
          {activeTab === 'customers' && <CustomersManagement />}
          {activeTab === 'quotes' && <QuotationsManagement />}
          {activeTab === 'returns' && <ReturnsManagement />}
          {activeTab === 'analytics' && <AnalyticsReports />}
          {activeTab === 'monitoring' && <SystemMonitoring />}
        </div>
      </div>
    </div>
  );
}
