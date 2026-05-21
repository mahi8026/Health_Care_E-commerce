"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import ManufacturersManagement from '@/components/admin/ManufacturersManagement';
import CategoriesManagement from '@/components/admin/CategoriesManagement';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  // Ref to trigger the create modal inside ProductsManagement from the top bar
  const openCreateProductRef = useRef(null);

  // Handle navigation to coupons page (which is separate)
  useEffect(() => {
    if (activeTab === 'coupons') {
      router.push('/admin/coupons');
    }
  }, [activeTab, router]);

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
    manufacturers: { title: 'Manufacturers', action: '+ Add Manufacturer' },
    categories: { title: 'Categories', action: '+ Add Category' },
    coupons: { title: 'Coupons & Discounts', action: '+ Create coupon' },
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
    <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] min-h-screen bg-page-muted">
      <h2 className="absolute w-px h-px overflow-hidden clip-[rect(0,0,0,0)]">
        MedCore BD Admin Panel — full dashboard with orders, products, customers and analytics
      </h2>

      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden bg-[#0B2545] text-white p-4 flex items-center justify-between">
        <div className="font-[family-name:var(--font-lora)] text-[18px] font-semibold">
          MedCore<span className="text-[#4DDBB8]">BD</span>
        </div>
        <div className="text-[10px] text-white/60">Admin Panel</div>
      </div>

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden md:block">
        <AdminSidebar 
          user={adminUser} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      </div>

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
        <div className="p-3 sm:p-4 md:p-5 md:px-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
          {activeTab === 'orders' && <OrdersManagement />}
          {activeTab === 'products' && (
            <ProductsManagement openCreateRef={openCreateProductRef} />
          )}
          {activeTab === 'customers' && <CustomersManagement />}
          {activeTab === 'manufacturers' && <ManufacturersManagement />}
          {activeTab === 'categories' && <CategoriesManagement />}
          {activeTab === 'quotes' && <QuotationsManagement />}
          {activeTab === 'returns' && <ReturnsManagement />}
          {activeTab === 'analytics' && <AnalyticsReports />}
          {activeTab === 'monitoring' && <SystemMonitoring />}
        </div>
      </div>
    </div>
  );
}
