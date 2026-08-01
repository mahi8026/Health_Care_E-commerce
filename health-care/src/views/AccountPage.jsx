"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import { API } from '@/constants/api';
import Spinner from '@/components/ui/Spinner';
import LoyaltyPointsCard from '@/components/account/LoyaltyPointsCard';
import B2BStatusCard from '@/components/account/B2BStatusCard';
import { 
  FaUser, 
  FaShoppingBag, 
  FaHeart, 
  FaStar, 
  FaMapMarkerAlt, 
  FaCreditCard,
  FaBell,
  FaShieldAlt,
  FaSignOutAlt,
  FaEdit,
  FaChevronRight
} from 'react-icons/fa';

export default function AccountPage() {
  const router = useRouter();
  const t = useT();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    wishlistItems: 0,
    reviewsWritten: 0
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/account');
      return;
    }

    // Fetch user stats
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('Mediport_token');
        
        // Fetch each endpoint separately to handle errors individually
        let orders = [];
        let wishlist = [];
        let reviews = [];

        // Fetch orders
        try {
          const ordersRes = await fetch(`${API}/orders`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            orders = ordersData.data?.orders || ordersData.orders || [];
          }
        } catch (error) {
          // Silently fail - orders will show as 0
        }

        // Fetch wishlist
        try {
          const wishlistRes = await fetch(`${API}/wishlist`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (wishlistRes.ok) {
            const wishlistData = await wishlistRes.json();
            wishlist = wishlistData.data?.items || wishlistData.items || [];
          }
        } catch (error) {
          // Silently fail - wishlist will show as 0
        }

        // Fetch reviews
        try {
          const reviewsRes = await fetch(`${API}/reviews/user`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            reviews = reviewsData.data?.reviews || reviewsData.reviews || [];
          }
        } catch (error) {
          // Silently fail - reviews will show as 0
        }

        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
          wishlistItems: wishlist.length,
          reviewsWritten: reviews.length
        });
      } catch (error) {
        // Error already handled - stats will show as 0
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background-secondary)] p-4">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
          {/* Header skeleton */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border-tertiary)]">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full animate-shimmer" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-48 animate-shimmer" />
                <div className="h-4 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-64 animate-shimmer" />
              </div>
            </div>
          </div>
          
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-[var(--color-border-tertiary)] animate-pulse">
                <div className="h-10 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-lg animate-shimmer" />
              </div>
            ))}
          </div>
          
          {/* Menu items skeleton */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border-tertiary)] space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-lg animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      section: 'Orders & Shopping',
      items: [
        { icon: <FaShoppingBag />, label: t('account.myOrders'), description: `${stats.totalOrders} orders`, href: '/orders', badge: stats.pendingOrders > 0 ? stats.pendingOrders : null },
        { icon: <FaHeart />, label: t('account.wishlist'), description: `${stats.wishlistItems} items`, href: '/wishlist' },
        { icon: <FaStar />, label: t('account.myReviews'), description: `${stats.reviewsWritten} reviews`, href: '/account/reviews' },
        { icon: <FaStar />, label: 'Loyalty Points', description: `${user?.loyaltyPoints || 0} pts available`, href: '/account/loyalty' },
      ]
    },
    {
      section: 'Account Settings',
      items: [
        { icon: <FaUser />, label: t('account.profile'), description: 'Edit your details', href: '/account/profile' },
        { icon: <FaMapMarkerAlt />, label: t('account.addresses'), description: 'Manage delivery addresses', href: '/account/addresses' },
        { icon: <FaCreditCard />, label: t('account.paymentMethods'), description: 'Saved cards & methods', href: '/account/payment-methods' },
      ]
    },
    {
      section: 'Preferences',
      items: [
        { icon: <FaBell />, label: t('account.notifications'), description: 'Email & SMS preferences', href: '/account/notifications' },
        { icon: <FaShieldAlt />, label: t('account.security'), description: 'Password & security', href: '/account/security' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border-tertiary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-teal rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-semibold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
                  {user?.name || 'User'}
                </h1>
                <p className="text-xs sm:text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
                  {user?.email}
                </p>
                {user?.role === 'b2b' && (
                  <span className="inline-block mt-1 text-xs sm:text-xs bg-brand-teal-tint text-brand-teal px-2 py-0.5 rounded-full font-medium">
                    B2B Customer
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/account/profile')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--color-background-tertiary)] transition-colors"
            >
              <FaEdit size={14} />
              {t('account.editProfile')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* B2B Status Card - Shows approval status and pricing eligibility */}
        <B2BStatusCard user={user} />

        {/* Loyalty Points Card - Full Width */}
        {user?.loyaltyPoints > 0 && (
          <div className="mb-4">
            <LoyaltyPointsCard points={user.loyaltyPoints} />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-[var(--color-border-tertiary)]">
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-brand-navy mb-1">
              {stats.totalOrders}
            </div>
            <div className="text-xs sm:text-xs text-[var(--color-text-secondary)]">
              {t('account.totalOrders')}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-[var(--color-border-tertiary)]">
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-warning mb-1">
              {stats.pendingOrders}
            </div>
            <div className="text-xs sm:text-xs text-[var(--color-text-secondary)]">
              {t('account.pending')}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-[var(--color-border-tertiary)]">
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-danger mb-1">
              {stats.wishlistItems}
            </div>
            <div className="text-xs sm:text-xs text-[var(--color-text-secondary)]">
              {t('account.wishlist')}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-[var(--color-border-tertiary)]">
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-brand-teal mb-1">
              {stats.reviewsWritten}
            </div>
            <div className="text-xs sm:text-xs text-[var(--color-text-secondary)]">
              {t('account.reviews')}
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-4 sm:space-y-6">
          {menuItems.map((section) => (
            <div key={section.section}>
              <h2 className="text-sm sm:text-sm font-semibold text-[var(--color-text-secondary)] mb-2 sm:mb-3 px-1">
                {section.section}
              </h2>
              <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] divide-y divide-[var(--color-border-tertiary)]">
                {section.items.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-[var(--color-background-tertiary)] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--color-background-secondary)] rounded-lg flex items-center justify-center text-brand-navy flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-sm font-medium text-brand-navy flex items-center gap-2">
                          {item.label}
                          {item.badge && (
                            <span className="bg-danger text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <FaChevronRight className="text-[var(--color-text-tertiary)] flex-shrink-0 ml-2" size={14} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full bg-white border border-[var(--color-border-tertiary)] rounded-lg p-3 sm:p-4 flex items-center justify-center gap-2 sm:gap-3 text-danger hover:bg-[var(--color-status-danger-tint)] transition-colors font-medium text-sm sm:text-sm"
          >
            <FaSignOutAlt size={16} />
            {t('account.logout')}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-0"></div>
    </div>
  );
}
