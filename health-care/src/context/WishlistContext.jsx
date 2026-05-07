"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

import { API } from '@/constants/api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated()) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('medcore_token');
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
  };

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated()) {
      return { success: false, requiresLogin: true };
    }

    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/wishlist/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Refresh wishlist
        await fetchWishlist();
        return { success: true, added: data.data.added };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Toggle wishlist error:', error);
      return { success: false, message: 'Failed to update wishlist' };
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated()) {
      return { success: false, requiresLogin: true };
    }

    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Update local state
        setWishlist(wishlist.filter(p => p._id !== productId));
        return { success: true };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Remove from wishlist error:', error);
      return { success: false, message: 'Failed to remove from wishlist' };
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(p => p._id === productId);
  };

  const value = {
    wishlist,
    wishlistCount: wishlist.length,
    loading,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist: fetchWishlist
  };

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

