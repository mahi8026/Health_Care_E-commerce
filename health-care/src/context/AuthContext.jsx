"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setToken, getToken, removeToken } from '@/utils/api';
import GA4Tracker from '@/services/GA4Tracker';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true to properly check auth on mount

  // Rehydrate user from token on page refresh
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return; // No token, no need to fetch
      }
      
      try {
        // Increase timeout to 8s to handle slow networks (FIX 11)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
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
          setUser(null);
        }
        console.error('[AuthContext] Failed to load user:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
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
      
      // Trigger cart sync after successful login
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user-logged-in'));
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
      
      // Trigger cart sync after successful registration
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user-logged-in'));
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
