'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { CONTACT } from '@/constants/api';

export default function OrderTrackingPage({ orderNumber: initialOrderNumber }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialOrderNumber) {
      handleTrack(initialOrderNumber);
    }
  }, [initialOrderNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTrack = async (orderNum = orderNumber) => {
    if (!orderNum.trim()) {
      setError('Please enter an order number');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await api.trackOrder(orderNum.trim());
      setOrder(result.order);
      
      // Update URL if tracking from search
      if (!initialOrderNumber) {
        router.push(`/track/${orderNum.trim()}`);
      }
    } catch (err) {
      setError(err.message || 'Order not found. Please check your order number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order?._id) return;
    
    setDownloading(true);
    try {
      const blob = await api.downloadInvoice(order._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Failed to download invoice
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleTrack();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-teal-600',
      active: 'text-navy-600',
      pending: 'text-gray-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusBgColor = (status) => {
    const colors = {
      completed: 'bg-teal-100',
      active: 'bg-navy-100',
      pending: 'bg-gray-100'
    };
    return colors[status] || 'bg-gray-100';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstimatedDelivery = () => {
    if (order?.estimatedDelivery) {
      return formatDate(order.estimatedDelivery);
    }
    if (order?.status === 'delivered') {
      return 'Delivered';
    }
    return '2-5 business days';
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your order number to see real-time tracking</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter order number (e.g., ORD-00001)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#0E8A6E] text-white rounded-lg font-semibold hover:bg-[#0c7a5f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B2545] mb-1">
                    Order {order.orderNumber}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Estimated Delivery */}
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="bg-[#E6F1FB] border border-[#0C447C] rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    <div>
                      <div className="text-sm text-[#0C447C] font-semibold">Estimated Delivery</div>
                      <div className="text-[#0C447C]">{getEstimatedDelivery()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#0B2545] mb-4">Order Timeline</h3>
                {order.timeline && order.timeline.map((step, index) => (
                  <div key={step.key} className="flex gap-4">
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${getStatusBgColor(step.status)}`}>
                        {step.icon}
                      </div>
                      {index < order.timeline.length - 1 && (
                        <div className={`w-0.5 h-12 ${step.status === 'completed' ? 'bg-teal-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className={`font-semibold ${getStatusColor(step.status)}`}>
                        {step.label}
                      </div>
                      {step.timestamp && (
                        <div className="text-sm text-gray-600 mt-1">
                          {formatDate(step.timestamp)}
                        </div>
                      )}
                      {step.status === 'active' && !step.timestamp && (
                        <div className="text-sm text-gray-600 mt-1">In progress...</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Details */}
            {order.tracking && (order.tracking.courier || order.tracking.trackingNumber) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-[#0B2545] mb-4">Shipping Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {order.tracking.courier && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Courier</div>
                      <div className="font-semibold">{order.tracking.courier}</div>
                    </div>
                  )}
                  {order.tracking.trackingNumber && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tracking Number</div>
                      <div className="font-mono text-sm font-semibold">{order.tracking.trackingNumber}</div>
                    </div>
                  )}
                  {order.tracking.dispatchedAt && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Dispatched At</div>
                      <div className="font-semibold">{formatDate(order.tracking.dispatchedAt)}</div>
                    </div>
                  )}
                </div>
                {order.coldChain && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <span className="text-xl">❄️</span>
                    <span className="text-sm text-blue-700 font-semibold">Cold Chain Delivery</span>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-[#0B2545] mb-4">Delivery Address</h3>
                <div className="text-gray-700">
                  {order.deliveryAddress.name && <div className="font-semibold">{order.deliveryAddress.name}</div>}
                  {order.deliveryAddress.phone && <div className="text-sm">{order.deliveryAddress.phone}</div>}
                  <div className="mt-2">
                    {order.deliveryAddress.street && <div>{order.deliveryAddress.street}</div>}
                    {order.deliveryAddress.thana && <div>{order.deliveryAddress.thana}</div>}
                    {order.deliveryAddress.district && <div>{order.deliveryAddress.district}</div>}
                    {order.deliveryAddress.postcode && <div>{order.deliveryAddress.postcode}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-[#0B2545] mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        {item.sku && <div className="text-sm text-gray-600">SKU: {item.sku}</div>}
                        {item.brand && <div className="text-sm text-gray-600">{item.brand}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Qty: {item.qty || item.quantity}</div>
                        <div className="font-semibold">৳{(item.price || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>৳{(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span>৳{order.deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  {order.vatAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">VAT (5%)</span>
                      <span>৳{order.vatAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#0E8A6E]">৳{(order.totalAmount || order.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="px-6 py-3 border border-[#0E8A6E] text-[#0E8A6E] rounded-lg font-semibold hover:bg-[#E1F5EE] transition-colors disabled:opacity-50"
              >
                {downloading ? 'Downloading...' : '📄 Download Invoice'}
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
              <a
                href={`https://wa.me/${CONTACT.whatsapp}?text=I need help with order ${order.orderNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <span>💬</span>
                WhatsApp Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

