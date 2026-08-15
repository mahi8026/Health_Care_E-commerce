"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import GA4Tracker from '@/services/GA4Tracker';
import { showToast } from '@/components/ui/Toast';
import { API } from '@/constants/api';

import { CART_CONFIG } from '@/constants/config';

const MAX_CART_ITEMS = CART_CONFIG.MAX_ITEMS;
const CartContext = createContext();

const EMPTY_CART = [];

// Debounced localStorage persistence — avoids a synchronous JSON.stringify
// + write on every cart mutation (rapid quantity clicks, multi-add).
const persistQueue = new Map();
function schedulePersist(key, value) {
  persistQueue.set(key, value);
  if (persistQueue.size === 1) {
    setTimeout(() => {
      persistQueue.forEach((v, k) => {
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch {
          // localStorage may be blocked (Safari private mode, etc.)
        }
      });
      persistQueue.clear();
    }, 250);
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [syncPending, setSyncPending] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('Mediport_token') : null;
      setIsLoggedIn(!!token);
    };
    checkAuth();
  }, []);

  // Update cart in backend if logged in
  const updateBackendCart = useCallback(async (action, productId, quantity, size = null) => {
    if (!isLoggedIn) return;

    try {
      const token = localStorage.getItem('Mediport_token');
      let url = `${API}/cart/items`;
      let method = 'POST';
      let body = {};

      if (action === 'add') {
        body = { productId, quantity, selectedSize: size };
      } else if (action === 'update') {
        url = `${API}/cart/items/${productId}`;
        method = 'PUT';
        body = { quantity, selectedSize: size };
      } else if (action === 'remove') {
        url = `${API}/cart/items/${productId}`;
        method = 'DELETE';
      } else if (action === 'clear') {
        url = `${API}/cart`;
        method = 'DELETE';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Cart sync failed (${res.status})`);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error('Backend cart update error:', error);
      showToast.error('Cart update failed. Please try again.');
    }
  }, [isLoggedIn]);

  // Sync cart to backend when user logs in
   
  const syncCartToBackend = useCallback(async (retryCount = 0) => {
    if (!isLoggedIn || syncPending || cart.length === 0) return;

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // Start with 1 second

    setSyncPending(true);
    try {
      const token = localStorage.getItem('Mediport_token');
      const response = await fetch(`${API}/cart/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: cart })
      });

      if (!response.ok) {
        throw new Error(`Cart sync failed (${response.status})`);
      }

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
      setSyncPending(false);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error('Cart sync error:', error);
      setSyncPending(false);
      showToast.warning('Could not sync cart. Changes saved locally.');
    }
  }, [isLoggedIn, cart, syncPending]);

  // Listen for login event to trigger cart sync
  // syncCartToBackendRef keeps this listener stable so it is not torn
  // down/re-added on every cart mutation.
  const syncCartToBackendRef = useRef(syncCartToBackend);
  useEffect(() => {
    syncCartToBackendRef.current = syncCartToBackend;
  }, [syncCartToBackend]);

  useEffect(() => {
    const handleLogin = () => {
      setIsLoggedIn(true);
      // Sync cart after a short delay to ensure token is set
      setTimeout(() => {
        syncCartToBackendRef.current();
      }, 500);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('user-logged-in', handleLogin);
      return () => window.removeEventListener('user-logged-in', handleLogin);
    }
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('Mediport_cart');
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
      } catch {
        // Ignore parse errors — start with empty cart
      }
    };
    loadCart();
  }, []);

  // Persist cart to localStorage (debounced — rapid mutations coalesce)
  useEffect(() => {
    schedulePersist('Mediport_cart', cart);
  }, [cart]);

  const addToCart = useCallback((product, quantity = 1, options = {}) => {
    // ── Auth gate: guests must log in before adding to cart ──────────────────
    const token = typeof window !== 'undefined' ? localStorage.getItem('Mediport_token') : null;
    if (!token) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('require-login-for-cart', {
          detail: { productName: product?.name || '' }
        }));
      }
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

    const safeQty = Math.max(1, quantity);
    const productId = product.id || product._id;
    const { size } = options;
    
    if (!productId) {
      process.env.NODE_ENV !== "production" && console.error('Product missing ID:', product);
      showToast.error('Failed to add product to cart');
      return;
    }

    // Normalize populated objects to plain strings so cart items are always serializable
    const normalizedProduct = {
      ...product,
      id: productId,
      brand: typeof product.brand === 'object' ? (product.brand?.name || '') : (product.brand || ''),
      category: typeof product.category === 'object' ? (product.category?.name || '') : (product.category || ''),
    };

    // Add size information if provided
    if (size) {
      normalizedProduct.selectedSize = {
        name: size.name,
        priceAdjustment: size.priceAdjustment || 0
      };
    }

    // For products with sizes, treat each size as a unique cart item
    const cartKey = size ? `${productId}-${size.name}` : productId;
    const existingItem = cart.find(item => {
      const itemId = item.id || item._id;
      const itemSize = item.selectedSize?.name;
      const currentSize = size?.name;

      if (size) {
        return itemId === productId && itemSize === currentSize;
      }
      return itemId === productId && !itemSize;
    });

    if (cart.length >= MAX_CART_ITEMS) {
      showToast.warning(`Cart is full! Maximum ${MAX_CART_ITEMS} items allowed.`);
      return;
    }

    let newCart;
    if (existingItem) {
      newCart = cart.map(item => {
        const itemId = item.id || item._id;
        const itemSize = item.selectedSize?.name;
        const currentSize = size?.name;

        if (size) {
          return (itemId === productId && itemSize === currentSize)
            ? { ...item, quantity: item.quantity + safeQty }
            : item;
        }
        return (itemId === productId && !itemSize)
          ? { ...item, quantity: item.quantity + safeQty }
          : item;
      });
      showToast.success(`Updated ${product.name}${size ? ` (${size.name})` : ''} quantity in cart`);
    } else {
      newCart = [...cart, { ...normalizedProduct, quantity: safeQty }];
      showToast.success(`${product.name}${size ? ` (${size.name})` : ''} added to cart!`);
    }

    // Side effects live OUTSIDE the state updater so React can never run them
    // twice (StrictMode double-invoke) — no duplicate analytics or sync calls.
    setCart(newCart);
    GA4Tracker.trackAddToCart(product, safeQty);
    updateBackendCart('add', productId, safeQty, size);
  }, [cart, updateBackendCart]);

  const removeFromCart = useCallback((productId) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
      GA4Tracker.trackRemoveFromCart(item, item.quantity);
      showToast.info(`${item.name} removed from cart`);
    }

    setCart(cart.filter(i => i.id !== productId));
    updateBackendCart('remove', productId);
  }, [cart, updateBackendCart]);

  const updateQuantity = useCallback((productId, quantity) => {
    // Enforce minimum quantity of 1
    const safeQty = Math.max(1, quantity);
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: safeQty } : item
    ));
    updateBackendCart('update', productId, safeQty);
  }, [cart, removeFromCart, updateBackendCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    showToast.success('Cart cleared successfully');
    
    // Update backend if logged in
    updateBackendCart('clear');
  }, [updateBackendCart]);

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

  const value = useMemo(() => ({
    cart,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    syncCartToBackend
  }), [cart, cartTotal, cartCount, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, syncCartToBackend]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
