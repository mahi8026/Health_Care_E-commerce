"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import GA4Tracker from '@/services/GA4Tracker';

const MAX_CART_ITEMS = 50;
const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Load cart and wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('medcore_cart');
      const savedWishlist = localStorage.getItem('medcore_wishlist');
      if (savedCart) setCart(JSON.parse(savedCart));
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

  const addToCart = useCallback((product, quantity = 1) => {
    const safeQty = Math.max(1, quantity);
    setCart(prevCart => {
      if (prevCart.length >= MAX_CART_ITEMS) return prevCart;
      const existingItem = prevCart.find(item => item.id === product.id);
      GA4Tracker.trackAddToCart(product, safeQty);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + safeQty }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: safeQty }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.id === productId);
      if (item) {
        GA4Tracker.trackRemoveFromCart(item, item.quantity);
      }
      return prevCart.filter(item => item.id !== productId);
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    // Enforce minimum quantity of 1
    const safeQty = Math.max(1, quantity);
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: safeQty } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

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
    getCartCount
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
