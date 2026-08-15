"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { showToast } from '@/components/ui/Toast';
import { API } from '@/constants/api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setWishlist(data.data.products || []);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Fetch wishlist error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch wishlist when user logs in
  useEffect(() => {
    (async () => {
      if (isAuthenticated()) {
        fetchWishlist();
      } else {
        // Reset wishlist when user logs out - this is intentional state sync
        setWishlist([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleWishlist = useCallback(async (productId) => {
    if (!isAuthenticated()) {
      showToast.warning('Please login to add items to wishlist');
      return { success: false, requiresLogin: true };
    }

    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/wishlist/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        // Refresh wishlist
        await fetchWishlist();
        showToast.success(data.data.added ? 'Added to wishlist!' : 'Removed from wishlist');
        return { success: true, added: data.data.added };
      }

      showToast.error(data.message || 'Failed to update wishlist');
      return { success: false, message: data.message };
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Toggle wishlist error:', error);
      showToast.error('Failed to update wishlist');
      return { success: false, message: 'Failed to update wishlist' };
    }
  }, [fetchWishlist, isAuthenticated]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!isAuthenticated()) {
      showToast.warning('Please login to manage wishlist');
      return { success: false, requiresLogin: true };
    }

    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setWishlist(prev => prev.filter(p => p._id !== productId));
        showToast.success('Removed from wishlist');
        return { success: true };
      }

      showToast.error(data.message || 'Failed to remove from wishlist');
      return { success: false, message: data.message };
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Remove from wishlist error:', error);
      showToast.error('Failed to remove from wishlist');
      return { success: false, message: 'Failed to remove from wishlist' };
    }
  }, [isAuthenticated]);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some(p => p._id === productId);
  }, [wishlist]);

  const value = useMemo(() => ({
    wishlist,
    wishlistCount: wishlist.length,
    loading,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist: fetchWishlist
  }), [wishlist, loading, toggleWishlist, removeFromWishlist, isInWishlist, fetchWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}

