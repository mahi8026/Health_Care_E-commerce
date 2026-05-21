"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import GA4Tracker from '@/services/GA4Tracker';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import DeliveryAddress from '@/components/checkout/DeliveryAddress';
import DeliveryOptions from '@/components/checkout/DeliveryOptions';
import PaymentMethods from '@/components/checkout/PaymentMethods';
import OrderSummary from '@/components/checkout/OrderSummary';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import PaymentModal from '@/components/payment/PaymentModal';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';

export default function CheckoutPage({ onBackToCart }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('bank_transfer');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  // FIX 1: hold the delivery address form data from the controlled DeliveryAddress component
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    district: 'Dhaka',
    thana: '',
    postcode: '',
    instructions: '',
  });
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const { cart, clearCart, getCartTotal } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Track begin_checkout when page loads with items
  useEffect(() => {
    if (cart.length > 0) {
      GA4Tracker.trackBeginCheckout(cart, getCartTotal());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Cart', href: '/cart' },
    { label: 'Checkout', href: '#' }
  ];

  const handlePlaceOrder = useCallback(async () => {
    if (!isAuthenticated()) {
      setError('Please login to place an order');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        items: cart.map(item => ({
          product: item.id || item._id,
          qty: item.quantity,
          quantity: item.quantity,
          price: item.price || 0
        })),
        deliveryType: selectedDelivery,
        deliveryMethod: selectedDelivery,
        paymentMethod: selectedPayment,
        // FIX 1: use the form data the user actually filled in
        deliveryAddress: {
          name: deliveryAddress.fullName,
          phone: deliveryAddress.phone,
          street: deliveryAddress.street,
          thana: deliveryAddress.thana,
          district: deliveryAddress.district,
          postcode: deliveryAddress.postcode,
          instructions: deliveryAddress.instructions,
        },
        // Include coupon code if applied
        ...(appliedCoupon && { promoCode: appliedCoupon.code })
      };

      const response = await api.createOrder(orderData);
      const orderNumber = response.order.orderNumber || response.order.orderId || `ORD-${response.order._id}`;
      const mongoId = response.order._id || response.order.id;
      
      setCreatedOrderId(mongoId);
      setOrderId(orderNumber);

      if (['bkash', 'nagad', 'b2b_credit'].includes(selectedPayment)) {
        setShowPaymentModal(true);
      } else {
        GA4Tracker.trackPurchase({
          orderId: orderNumber,
          total: getCartTotal(),
          deliveryFee: selectedDelivery === 'express' ? 300 : 150,
          items: cart.map(item => ({ product: item.id, name: item.name, price: item.price || 0, quantity: item.quantity })),
          paymentMethod: selectedPayment
        });
        setIsConfirmed(true);
        clearCart();
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cart, clearCart, getCartTotal, isAuthenticated, selectedDelivery, selectedPayment, deliveryAddress, appliedCoupon]);

  const handlePaymentSuccess = useCallback(() => {
    GA4Tracker.trackPurchase({
      orderId: orderId,
      total: getCartTotal(),
      deliveryFee: selectedDelivery === 'express' ? 300 : 150,
      items: cart.map(item => ({ product: item.id, name: item.name, price: item.price || 0, quantity: item.quantity })),
      paymentMethod: selectedPayment
    });
    setIsConfirmed(true);
    clearCart();
    setShowPaymentModal(false);
  }, [cart, clearCart, orderId, getCartTotal, selectedDelivery, selectedPayment]);

  const handlePaymentError = useCallback((err) => {
    setError(err?.message || 'Payment failed. Please try again.');
  }, []);

  if (cart.length === 0 && !isConfirmed) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-[64px] mb-4">🛒</div>
          <h2 className="text-[20px] font-semibold mb-2 font-[family-name:var(--font-lora)]">
            Your cart is empty
          </h2>
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">
            Add some products to your cart before checking out
          </p>
        </div>
      </div>
    );
  }

  const cartItems = cart.map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    variant: item.variant || '',
    warranty: item.warranty || '',
    note: item.note || '',
    quantity: item.quantity,
    price: item.price || 0,
    icon: item.icon || 'product'
  }));

  return (
    <div className="min-h-screen bg-page">
      <Breadcrumb items={breadcrumbs} />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-0">
        <div className="p-4 md:p-6 order-2 md:order-1">
          <CheckoutSteps currentStep={currentStep} />

          {!isConfirmed ? (
            <>
              {error && (
                <div role="alert" className="mb-4 p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">
                  {error}
                </div>
              )}

              <DeliveryAddress
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                savedAddress={user?.addresses?.[0]}
              />

              <DeliveryOptions
                selected={selectedDelivery}
                onSelect={(method) => {
                  setSelectedDelivery(method);
                  setCurrentStep(2);
                }}
              />

              <PaymentMethods
                selected={selectedPayment}
                onSelect={(method) => {
                  setSelectedPayment(method);
                  GA4Tracker.trackPaymentMethodSelected(method);
                  setCurrentStep(3);
                }}
              />

              {/* Desktop Buttons */}
              <div className="hidden md:flex gap-[10px]">
                <button
                  onClick={() => onBackToCart ? onBackToCart() : router.push('/cart')}
                  className="flex-1 px-[14px] py-3 rounded-lg border-[0.5px] border-[var(--color-border-secondary)] bg-transparent text-[var(--color-text-primary)] text-[13px] cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-background-tertiary)]"
                >
                  ← Back to cart
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-[2] bg-[#0B2545] text-white border-none px-3 py-3 rounded-[9px] text-[13px] font-semibold cursor-pointer font-[family-name:var(--font-plus-jakarta)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner size="small" />
                      Processing...
                    </>
                  ) : (
                    'Continue to payment →'
                  )}
                </button>
              </div>

              {/* Mobile Fixed Bottom Button */}
              <div className="md:hidden fixed bottom-[60px] left-0 right-0 p-4 bg-white border-t border-gray-200 z-[500]" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-[#0B2545] text-white border-none px-4 py-4 rounded-lg text-[14px] font-semibold cursor-pointer font-[family-name:var(--font-plus-jakarta)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px]"
                >
                  {loading ? (
                    <>
                      <Spinner size="small" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </>
          ) : (
            <OrderConfirmation
              orderId={orderId || 'ORD-XXXX'}
              mongoId={createdOrderId}
              estimatedDelivery="2–5 business days"
            />
          )}
        </div>

        <div className="p-4 md:p-6 bg-[var(--color-background-primary)] md:border-l-[0.5px] border-[var(--color-border-tertiary)] order-1 md:order-2">
          <OrderSummary 
            items={cartItems} 
            deliveryMethod={selectedDelivery}
            appliedCoupon={appliedCoupon}
            onCouponApply={setAppliedCoupon}
            userId={user?.id}
          />
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={getCartTotal()}
        orderId={createdOrderId}
        selectedMethod={selectedPayment}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
