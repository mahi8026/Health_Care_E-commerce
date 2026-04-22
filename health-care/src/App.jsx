"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import TopBar from './components/layout/TopBar';
import HomePage from './views/HomePage';
import DashboardSkeleton from './components/admin/DashboardSkeleton';
import DashboardErrorBoundary from './components/admin/DashboardErrorBoundary';
import Spinner from './components/ui/Spinner';

// Lazy-load all non-home views to reduce initial bundle size
// These components are only loaded when the user navigates to them
const ProductDetailPage = dynamic(() => import('./views/ProductDetailPage'), {
  loading: () => <Spinner />,
});

const CheckoutPage = dynamic(() => import('./views/CheckoutPage'), {
  loading: () => <Spinner />,
});

const ReagentStorePage = dynamic(() => import('./views/ReagentStorePage'), {
  loading: () => <Spinner />,
});

const MobileAppPage = dynamic(() => import('./views/MobileAppPage'), {
  loading: () => <Spinner />,
});

const LoginPage = dynamic(() => import('./views/LoginPage'), {
  loading: () => <Spinner />,
});

const RegisterPage = dynamic(() => import('./views/RegisterPage'), {
  loading: () => <Spinner />,
});

const CartPage = dynamic(() => import('./views/CartPage'), {
  loading: () => <Spinner />,
});

const SearchPage = dynamic(() => import('./views/SearchPage'), {
  loading: () => <Spinner />,
});

const OrderHistoryPage = dynamic(() => import('./views/OrderHistoryPage'), {
  loading: () => <Spinner />,
});

const ResetPasswordPage = dynamic(() => import('./views/ResetPasswordPage'), {
  loading: () => <Spinner />,
});

// Lazy-load Admin Dashboard with ssr: false to reduce initial bundle size
// This component is only needed for authenticated admin users
const AdminDashboardPage = dynamic(
  () => import('./views/AdminDashboardPage'),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />
  }
);

// Lazy-load B2B Dashboard with ssr: false to reduce initial bundle size
// This component is only needed for authenticated B2B users
const B2BDashboardPage = dynamic(
  () => import('./views/B2BDashboardPage'),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />
  }
);

function AppContent({ initialFeaturedProducts = [] }) {
  const [activeView, setActiveView] = useState('home');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { isAuthenticated, logout } = useAuth();

  // Initialize GA4 on mount — lazy-loaded to keep initial bundle small
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    if (measurementId) {
      import('./services/GA4Tracker').then(({ default: GA4Tracker }) => {
        GA4Tracker.initialize(measurementId);
      });
    }
  }, []);

  // Track page views on route changes — lazy-loaded to keep initial bundle small
  useEffect(() => {
    const pageTitles = {
      home: 'Home',
      search: 'Search Results',
      product: 'Product Details',
      cart: 'Shopping Cart',
      checkout: 'Checkout',
      reagent: 'Reagent Store',
      b2b: 'B2B Dashboard',
      admin: 'Admin Panel',
      mobile: 'Mobile App'
    };
    
    import('./services/GA4Tracker').then(({ default: GA4Tracker }) => {
      GA4Tracker.trackPageView(
        `/${activeView}`,
        pageTitles[activeView] || activeView
      );
    });
  }, [activeView]);

  const views = [
    { id: 'home', label: 'Homepage' },
    { id: 'search', label: 'Search' },
    { id: 'product', label: 'Product detail' },
    { id: 'cart', label: 'Shopping Cart' },
    { id: 'checkout', label: 'Checkout flow' },
    { id: 'reagent', label: 'Reagent store' },
    { id: 'b2b', label: 'B2B dashboard' },
    { id: 'admin', label: 'Admin panel' },
    { id: 'mobile', label: 'Mobile app' },
    { id: 'orders', label: 'Order History' },
    { id: 'reset-password', label: 'Reset Password' },
  ];

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setShowAuth(true);
  };

  const handleLogout = () => {
    logout();
    setActiveView('home');
  };

  const handleCheckout = () => {
    setActiveView('checkout');
  };

  // Show auth pages
  if (showAuth && !isAuthenticated()) {
    if (authMode === 'login') {
      return (
        <LoginPage
          onSwitchToRegister={() => setAuthMode('register')}
          onSuccess={() => setShowAuth(false)}
        />
      );
    } else {
      return (
        <RegisterPage
          onSwitchToLogin={() => setAuthMode('login')}
          onSuccess={() => setShowAuth(false)}
        />
      );
    }
  }

  return (
    <div className="font-[family-name:var(--font-plus-jakarta)] text-[13px] text-[var(--color-text-primary)] bg-[var(--color-background-tertiary)]">
      <h2 className="absolute w-px h-px overflow-hidden clip-[rect(0,0,0,0)]">
        MedCore BD — Medical E-commerce Platform
      </h2>

      {/* Render Active View */}
      {activeView !== 'mobile' && activeView !== 'b2b' && activeView !== 'admin' && (
        <>
          <TopBar />
          <Header
            onLoginClick={handleLoginClick}
            onRegisterClick={handleRegisterClick}
            onLogout={handleLogout}
            onCartClick={() => setActiveView('cart')}
            onNavigate={setActiveView}
            onSearchClick={() => setActiveView('search')}
          />
        </>
      )}

      {activeView === 'home' && (
        <HomePage 
          onNavigate={setActiveView}
          onRegisterClick={handleRegisterClick}
          initialFeaturedProducts={initialFeaturedProducts}
        />
      )}
      {activeView === 'search' && (
        <SearchPage 
          onProductClick={() => setActiveView('product')}
        />
      )}
      {activeView === 'product' && <ProductDetailPage />}
      {activeView === 'cart' && (
        <CartPage 
          onCheckout={handleCheckout}
          onContinueShopping={() => setActiveView('home')}
        />
      )}
      {activeView === 'checkout' && (
        <CheckoutPage 
          onBackToCart={() => setActiveView('cart')}
        />
      )}
      {activeView === 'reagent' && <ReagentStorePage />}
      {activeView === 'b2b' && (
        <DashboardErrorBoundary onNavigateHome={() => setActiveView('home')}>
          <B2BDashboardPage />
        </DashboardErrorBoundary>
      )}
      {activeView === 'admin' && (
        <DashboardErrorBoundary onNavigateHome={() => setActiveView('home')}>
          <AdminDashboardPage />
        </DashboardErrorBoundary>
      )}
      {activeView === 'mobile' && <MobileAppPage />}
      {activeView === 'orders' && (
        <OrderHistoryPage
          onNavigate={setActiveView}
          onLoginClick={handleLoginClick}
        />
      )}
      {activeView === 'reset-password' && (
        <ResetPasswordPage
          onNavigateToLogin={handleLoginClick}
        />
      )}
    </div>
  );
}

/**
 * Root App component.
 *
 * Accepts `initialFeaturedProducts` from the server component (page.jsx) so
 * that the homepage can hydrate immediately with server-prefetched data instead
 * of showing a loading spinner on first paint.
 *
 * @param {Object} props
 * @param {Object[]} [props.initialFeaturedProducts=[]] - Server-prefetched featured products.
 */
export default function App({ initialFeaturedProducts = [] }) {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent initialFeaturedProducts={initialFeaturedProducts} />
      </CartProvider>
    </AuthProvider>
  );
}
