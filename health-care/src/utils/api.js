import { API as API_BASE_URL } from '@/constants/api';
import { TIMEOUTS } from '@/constants/config';

// Dev-only logger — silent in production
const devLog = {
  error: (...args) => { if (process.env.NODE_ENV === 'development') process.env.NODE_ENV !== "production" && console.error('[API Error]', ...args); },  
};

// Get token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('medcore_token');
  }
  return null;
};

// Get refresh token from localStorage
const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('medcore_refresh_token');
  }
  return null;
};

// Set token in localStorage
const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('medcore_token', token);
  }
};

// Set refresh token in localStorage
const setRefreshToken = (refreshToken) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('medcore_refresh_token', refreshToken);
  }
};

// Remove token from localStorage
const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('medcore_token');
    localStorage.removeItem('medcore_refresh_token');
  }
};

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Subscribe to token refresh completion
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// Notify all subscribers when token is refreshed
function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        // Only log unexpected errors (not 400-level client errors)
        if (response.status >= 500) {
          devLog.error('[API] Server error:', data);
        }
        throw new ApiError(
          data.message || `HTTP Error ${response.status}`,
          response.status,
          data
        );
      }
      
      return data;
    } catch (error) {
      // If JSON parsing fails
      if (error instanceof ApiError) throw error;
      
      devLog.error('[API] handleResponse - JSON parse error:', error);
      throw new ApiError(
        `Failed to parse response: ${error.message}`,
        response.status,
        {}
      );
    }
  } else {
    // Handle non-JSON responses (HTML error pages, plain text, etc.)
    const text = await response.text();
    
    if (!response.ok) {
      devLog.error('[API] handleResponse - Non-JSON error:', text.substring(0, 200));
      throw new ApiError(
        text || `HTTP Error ${response.status}`,
        response.status,
        { text }
      );
    }
    
    // Try to parse as JSON anyway (some APIs don't set correct content-type)
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }
}

// Enhanced fetch with auto-retry on 401, 503, and timeout
async function fetchWithAuth(url, options = {}, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle 503 (Service Unavailable - Render backend sleeping)
    if (response.status === 503 && retryCount < MAX_RETRIES) {
      clearTimeout(timeoutId);
      // Backend is sleeping, retry with delay
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return fetchWithAuth(url, options, retryCount + 1);
    }
    
    // If 401 and we have a refresh token, try to refresh
    if (response.status === 401 && getRefreshToken()) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Attempt to refresh the token
          const refreshToken = getRefreshToken();
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include'
          });
          
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            if (data.token) {
              setToken(data.token);
              if (data.refreshToken) {
                setRefreshToken(data.refreshToken);
              }
              isRefreshing = false;
              onTokenRefreshed(data.token);
              
              // Retry original request with new token
              const newOptions = {
                ...options,
                headers: {
                  ...options.headers,
                  'Authorization': `Bearer ${data.token}`
                }
              };
              return fetch(url, newOptions);
            }
          }
          
          // Refresh failed, clear tokens and redirect to login (only in browser)
          isRefreshing = false;
          removeToken();
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return response;
        } catch (error) {
          isRefreshing = false;
          removeToken();
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return response;
        }
      } else {
        // Wait for the refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            const newOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
              }
            };
            resolve(fetch(url, newOptions));
          });
        });
      }
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    // Network error or timeout - retry if not max retries
    if (error.name === 'AbortError' || error.message.includes('fetch')) {
      if (retryCount < MAX_RETRIES) {
        // Retry with delay
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithAuth(url, options, retryCount + 1);
      }
      devLog.error('[API] Request failed after retries:', url);
      throw new ApiError(
        'Unable to connect to server. Please check your connection.',
        0,
        { originalError: error.message }
      );
    }
    throw error;
  }
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export const api = {
  // Products
  async getProducts(filters = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);
    
    try {
      const params = new URLSearchParams();
      
      // Set default limit to 20 per page if not specified
      const filtersWithLimit = {
        limit: 20,
        ...filters
      };
      
      // Only add non-empty filter values
      Object.entries(filtersWithLimit).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      
      const url = `${API_BASE_URL}/products?${params}`;
      
      const response = await fetchWithAuth(url, {
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await handleResponse(response);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      devLog.error('[API] getProducts error:', error);
      throw error;
    }
  },

  async getProduct(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async searchProducts(query) {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Orders
  async getOrders(filters = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetchWithAuth(`${API_BASE_URL}/orders?${params}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  async getOrder(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async createOrder(orderData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateOrder(id, updates) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async cancelOrder(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateOrderStatus(id, status, trackingNumber) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, trackingNumber }),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Order Tracking (Public)
  async trackOrder(orderNumber) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/track/${orderNumber}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async sendOrderConfirmation(orderId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type: 'confirmation' }),
    });
    return handleResponse(response);
  },

  async sendPaymentReceipt(orderId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type: 'payment' }),
    });
    return handleResponse(response);
  },

  async sendShippingNotification(orderId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type: 'shipping' }),
    });
    return handleResponse(response);
  },

  async sendDeliveryConfirmation(orderId) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/notify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type: 'delivery' }),
    });
    return handleResponse(response);
  },

  // Authentication
  async login(email, password) {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  async register(userData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  async refreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new ApiError('No refresh token available', 401);
    }
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include'
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  async logout() {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    removeToken();
    return handleResponse(response);
  },

  async getMe() {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateProfile(updates) {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async changePassword(currentPassword, newPassword) {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Quotations (B2B)
  async getQuotations() {
    const response = await fetchWithAuth(`${API_BASE_URL}/quotes`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getQuotation(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/quotes/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async createQuotation(quotationData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(quotationData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Analytics
  async getAnalytics(period = 'month') {
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics?period=${period}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getSalesAnalytics(startDate, endDate, groupBy = 'day') {
    const params = new URLSearchParams({ startDate, endDate, groupBy });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/sales?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getOrderAnalytics(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/orders?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getCustomerAnalytics(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/customers?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getProductAnalytics(startDate, endDate, limit = 10) {
    const params = new URLSearchParams({ startDate, endDate, limit: limit.toString() });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/products?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getPaymentAnalytics(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/payments?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Customers
  async getCustomers(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/customers?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getCustomer(id) {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/customers/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateCustomer(id, updates) {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/customers/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Admin Dashboard
  async getAdminDashboard() {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getAdminAnalytics(period = 'month') {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/analytics?period=${period}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async manualStockCheck() {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/stock-check`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Admin Quote Management
  async getAllQuotes(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/quotes?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateQuote(id, updates) {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/quotes/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async convertQuoteToOrder(id, orderData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/quotes/${id}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Invoices
  async downloadInvoice(orderId) {
    const token = getToken();
    const response = await fetchWithAuth(`${API_BASE_URL}/invoices/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Failed to download invoice', response.status, error);
    }
    
    // Return blob for PDF download
    return response.blob();
  },

  // Notifications (Admin)
  async sendOrderConfirmation(orderId) {
    try {
      return await this.post('/notifications/order-confirmation', { orderId });
    } catch (error) {
      devLog.error('[API] Send order confirmation failed:', error.message);
      throw error;
    }
  },

  async sendPaymentReceipt(orderId) {
    try {
      return await this.post('/notifications/payment-receipt', { orderId });
    } catch (error) {
      devLog.error('[API] Send payment receipt failed:', error.message);
      throw error;
    }
  },

  async sendShippingNotification(orderId) {
    try {
      return await this.post('/notifications/shipping', { orderId });
    } catch (error) {
      devLog.error('[API] Send shipping notification failed:', error.message);
      throw error;
    }
  },

  async sendDeliveryConfirmation(orderId) {
    try {
      return await this.post('/notifications/delivered', { orderId });
    } catch (error) {
      devLog.error('[API] Send delivery confirmation failed:', error.message);
      throw error;
    }
  },

  async sendQuotationReady(quoteId) {
    try {
      return await this.post('/notifications/quotation-ready', { quoteId });
    } catch (error) {
      devLog.error('[API] Send quotation ready failed:', error.message);
      throw error;
    }
  },

  async sendStockAlert() {
    try {
      return await this.post('/notifications/stock-alert', {});
    } catch (error) {
      devLog.error('[API] Send stock alert failed:', error.message);
      throw error;
    }
  },

  // Generic HTTP methods
  async get(endpoint) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async post(endpoint, data) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async put(endpoint, data) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async patch(endpoint, data) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async delete(endpoint) {
    const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Payments
  async initiateBkashPayment(amount, orderId) {
    return this.post('/payments/bkash/initiate', { amount, orderId });
  },

  async executeBkashPayment(paymentID) {
    return this.post('/payments/bkash/execute', { paymentID });
  },

  async verifyBkashPayment(paymentId, orderId) {
    return this.post('/payments/bkash/verify', { paymentId, orderId });
  },

  async submitBankTransfer(orderId, transactionReference) {
    return this.post('/payments/bank/submit', { orderId, transactionReference });
  },

  async processB2BCreditPayment(orderId) {
    return this.post('/payments/credit/process', { orderId });
  },

  async submitChequePayment(orderId, chequeData) {
    return this.post('/payments/cheque', { orderId, ...chequeData });
  },

  async initiateNagadPayment(amount, orderId) {
    return this.post('/payments/nagad/initiate', { amount, orderId });
  },

  async verifyNagadPayment(paymentId, orderId) {
    return this.post('/payments/nagad/verify', { paymentId, orderId });
  }
};

export { setToken, getToken, removeToken, getRefreshToken, setRefreshToken };
export default api;
