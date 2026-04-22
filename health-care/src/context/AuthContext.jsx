"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setToken, getToken, removeToken } from '@/utils/api';
import GA4Tracker from '@/services/GA4Tracker';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Changed from true to false - don't block initial render

  // Rehydrate user from token on page refresh
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (!token) {
        return; // No token, no need to fetch
      }
      
      setLoading(true);
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await api.getMe();
        clearTimeout(timeoutId);
        
        setUser(response.user);
        if (response.user?._id) {
          GA4Tracker.setUserId(response.user._id);
        }
      } catch (error) {
        // Only clear tokens on auth errors, not network errors
        if (error.status === 401 || error.status === 403) {
          removeToken();
        }
        console.error('[AuthContext] Failed to load user:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Don't block render - load user in background
    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      if (response.user?._id) {
        GA4Tracker.setUserId(response.user._id);
      }
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAsAdmin = useCallback(async (email, password) => {
    return login(email, password);
  }, [login]);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const response = await api.register(userData);
      setUser(response.user);
      if (response.user?._id) {
        GA4Tracker.setUserId(response.user._id);
      }
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout API errors — always clear local state
    }
    GA4Tracker.clearUserId();
    setUser(null);
    removeToken();
    // Clear cart from localStorage on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medcore_cart');
      localStorage.removeItem('medcore_wishlist');
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      const response = await api.updateProfile(updates);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const isAuthenticated = useCallback(() => !!user, [user]);
  const isAdmin = useCallback(() => user?.role === 'admin', [user]);
  const isB2BCustomer = useCallback(() => user?.role === 'b2b_customer', [user]);

  const value = {
    user,
    loading,
    login,
    loginAsAdmin,
    register,
    logout,
    updateProfile,
    isAuthenticated,
    isAdmin,
    isB2BCustomer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
