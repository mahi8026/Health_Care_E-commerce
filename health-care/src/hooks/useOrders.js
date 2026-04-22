"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';

export function useOrders(userId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.getOrders(userId);
      setOrders(response.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = useCallback(async (orderData) => {
    try {
      const response = await api.createOrder(orderData);
      await fetchOrders();
      return { success: true, order: response.order };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchOrders]);

  const updateOrder = useCallback(async (orderId, updates) => {
    try {
      const response = await api.updateOrder(orderId, updates);
      await fetchOrders();
      return { success: true, order: response.order };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders, createOrder, updateOrder };
}

export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.getOrder(orderId);
      setOrder(response.order || response);
    } catch (err) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}
