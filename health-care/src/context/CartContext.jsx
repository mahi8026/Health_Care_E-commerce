"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import GA4Tracker from '@/services/GA4Tracker';

import { API } from '@/constants/api';

import { CART_CONFIG } from '@/constants/config';

const MAX_CART_ITEMS = CART_CONFIG.MAX_ITEMS;
const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [syncPending, setSyncPending] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('medcore_token') : null;
    setIsLoggedIn(!!token);
  }, []);

  // Sync cart to backend when user logs in
  const syncCartToBackend = useCallback(async (retryCount = 0) => {
    if (!isLoggedIn || syncPending || cart.length === 0) return;

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // Start with 1 second

    setSyncPending(true);
    try {
      const token = localStorage.getItem('medcore_token');
      const response = await fetch(`${API}/cart/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: cart })
      });

      const data = await response.json();
      if (data.success && data.data) {
        // Update cart with merged result from backend — normalize populated fields
        const mergedCart = data.data.items.map(item => ({
          id: item.product._id,
          _id: item.product._id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.price,
          images: item.product.images,
          brand: typeof item.product.brand === 'object' ? (item.product.brand?.name || '') : (item.product.brand || ''),
          category: typeof item.product.category === 'object' ? (item.product.category?.name || '') : (item.product.category || ''),
          stock: item.product.stock,
          quantity: item.quantity
        }));
        setCart(mergedCart);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Cart sync error:', error);
      
      // Retry with exponential backoff for network errors
      if (retryCount < MAX_RETRIES && error.message?.includes('network')) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        // Retry cart sync after delay
        setTimeout(() => {
          setSyncPending(false);
          syncCartToBackend(retryCount + 1);
        }, delay);
        return; // Don't set syncPending to false yet
      }
    } finally {
      setSyncPending(false);
    }
  }, [isLoggedIn, cart, syncPending]);

  // Listen for login event to trigger cart sync
  useEffect(() => {
    const handleLogin = () => {
      setIsLoggedIn(true);
      // Sync cart after a short delay to ensure token is set
      setTimeout(() => {
        syncCartToBackend();
      }, 500);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('user-logged-in', handleLogin);
      return () => window.removeEventListener('user-logged-in', handleLogin);
    }
  }, [syncCartToBackend]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('medcore_cart');
      const savedWishlist = localStorage.getItem('medcore_wishlist');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        // Sanitize stale items that may have populated objects stored
        const sanitized = parsed.map(item => ({
          ...item,
          brand: typeof item.brand === 'object' ? (item.brand?.name || '') : (item.brand || ''),
          category: typeof item.category === 'object' ? (item.category?.name || '') : (item.category || ''),
        }));
        setCart(sanitized);
      }
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch {
      // Ignore parse errors — start with empty cart
    }
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medcore_cart', JSON.stringify(cart));
  }, [cart]);

  // Persist wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medcore_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Update cart in backend if logged in
  const updateBackendCart = useCallback(async (action, productId, quantity) => {
    if (!isLoggedIn) return;

    try {
      const token = localStorage.getItem('medcore_token');
      let url = `${API}/cart/items`;
      let method = 'POST';
      let body = {};

      if (action === 'add') {
        body = { productId, quantity };
      } else if (action === 'update') {
        url = `${API}/cart/items/${productId}`;
        method = 'PUT';
        body = { quantity };
      } else if (action === 'remove') {
        url = `${API}/cart/items/${productId}`;
        method = 'DELETE';
      } else if (action === 'clear') {
        url = `${API}/cart`;
        method = 'DELETE';
      }

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      });
    } catch (error) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Backend cart update error:', error);
    }
  }, [isLoggedIn]);

  const addToCart = useCallback((product, quantity = 1) => {
    const safeQty = Math.max(1, quantity);
    const productId = product.id || product._id;
    
    if (!productId) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Product missing ID:', product);
      return;
    }

    // Normalize populated objects to plain strings so cart items are always serializable
    const normalizedProduct = {
      ...product,
      id: productId,
      brand: typeof product.brand === 'object' ? (product.brand?.name || '') : (product.brand || ''),
      category: typeof product.category === 'object' ? (product.category?.name || '') : (product.category || ''),
    };

    setCart(prevCart => {
      if (prevCart.length >= MAX_CART_ITEMS) return prevCart;
      const existingItem = prevCart.find(item => (item.id || item._id) === productId);
      GA4Tracker.trackAddToCart(product, safeQty);
      
      let newCart;
      if (existingItem) {
        newCart = prevCart.map(item =>
          (item.id || item._id) === productId
            ? { ...item, quantity: item.quantity + safeQty }
            : item
        );
      } else {
        newCart = [...prevCart, { ...normalizedProduct, quantity: safeQty }];
      }

      updateBackendCart('add', productId, safeQty);
      return newCart;
    });
  }, [updateBackendCart]);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.id === productId);
      if (item) {
        GA4Tracker.trackRemoveFromCart(item, item.quantity);
      }
      
      // Update backend if logged in
      updateBackendCart('remove', productId);
      
      return prevCart.filter(item => item.id !== productId);
    });
  }, [updateBackendCart]);

  const updateQuantity = useCallback((productId, quantity) => {
    // Enforce minimum quantity of 1
    const safeQty = Math.max(1, quantity);
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart => {
      const newCart = prevCart.map(item =>
        item.id === productId ? { ...item, quantity: safeQty } : item
      );
      
      // Update backend if logged in
      updateBackendCart('update', productId, safeQty);
      
      return newCart;
    });
  }, [removeFromCart, updateBackendCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    
    // Update backend if logged in
    updateBackendCart('clear');
  }, [updateBackendCart]);

  const addToWishlist = useCallback((product) => {
    setWishlist(prevWishlist => {
      if (prevWishlist.find(item => item.id === product.id)) return prevWishlist;
      return [...prevWishlist, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId));
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => item.id === productId);
  }, [wishlist]);

  // Memoized cart total — recalculates whenever cart changes
  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + ((item.price || 0) * item.quantity), 0);
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Memoized cart total value for consumers that need it as a value (not function)
  const cartTotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const cartCount = useMemo(() => getCartCount(), [getCartCount]);

  const value = {
    cart,
    wishlist,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getCartTotal,
    getCartCount,
    syncCartToBackend
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
