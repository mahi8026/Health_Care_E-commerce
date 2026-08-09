"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api, { setToken, getToken, removeToken } from '@/utils/api';
import GA4Tracker from '@/services/GA4Tracker';

const AuthContext = createContext();

// Max time to wait for auth check before giving up (prevents infinite loading)
const AUTH_CHECK_TIMEOUT = 5000; // 5 seconds

function normalizeUser(u) {
  if (!u) return null;
  return { ...u, id: u.id || u._id };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true to properly check auth on mount
  const authCheckDone = useRef(false);

  // Rehydrate user from token on page refresh
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        authCheckDone.current = true;
        return; // No token, no need to fetch
      }

      // Safety timeout — never block the UI for more than AUTH_CHECK_TIMEOUT
      const timeoutId = setTimeout(() => {
        if (!authCheckDone.current) {
          authCheckDone.current = true;
          setLoading(false);
        }
      }, AUTH_CHECK_TIMEOUT);
      
      try {
        // Use a direct fetch with a short timeout instead of the retrying api.getMe()
        // to avoid the 3-retry × 2s delay (6s+) on stale tokens
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(fetchTimeout);

        if (response.ok) {
          const data = await response.json();
          const normalized = normalizeUser(data.user);
          setUser(normalized);
          if (normalized?.id) {
            GA4Tracker.setUserId(normalized.id);
          }
        } else if (response.status === 401 || response.status === 403) {
          // Token is invalid — clear it so user gets a clean login
          removeToken();
          setUser(null);
        }
        // For 5xx / network issues: keep the token, let the user retry naturally
      } catch {
        // Network error or abort — do NOT clear token, just stop loading
        // User may just be offline temporarily
      } finally {
        clearTimeout(timeoutId);
        authCheckDone.current = true;
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      const normalized = normalizeUser(response.user);
      setUser(normalized);
      if (normalized?.id) {
        GA4Tracker.setUserId(normalized.id);
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
      const normalized = normalizeUser(response.user);
      setUser(normalized);
      if (normalized?.id) {
        GA4Tracker.setUserId(normalized.id);
      }
      
      // Trigger cart sync after successful registration
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user-logged-in'));
      }
      
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message, errorDetails: error.data };
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
      localStorage.removeItem('Mediport_cart');
      localStorage.removeItem('Mediport_wishlist');
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      const response = await api.updateProfile(updates);
      setUser(normalizeUser(response.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const isAuthenticated = useCallback(() => !!user, [user]);
  const isAdmin = useCallback(() => user?.role === 'admin', [user]);
  const isB2BCustomer = useCallback(() => user?.role === 'b2b_customer', [user]);

  const value = useMemo(() => ({
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
  }), [user, loading, login, loginAsAdmin, register, logout, updateProfile, isAuthenticated, isAdmin, isB2BCustomer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
