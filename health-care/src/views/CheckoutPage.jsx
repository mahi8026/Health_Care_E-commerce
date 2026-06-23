"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import api from '@/utils/api';
import GA4Tracker from '@/services/GA4Tracker';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import DeliveryAddress from '@/components/checkout/DeliveryAddress';
import DeliveryOptions from '@/components/checkout/DeliveryOptions';
import PaymentMethods from '@/components/checkout/PaymentMethods';
import OrderSummary, { getDeliveryFee } from '@/components/checkout/OrderSummary';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import PaymentModal from '@/components/payment/PaymentModal';
import Spinner from '@/components/ui/Spinner';
import { FaArrowLeft } from 'react-icons/fa';
import CheckoutAuthGate from '@/components/checkout/CheckoutAuthGate';

export default function CheckoutPage({ onBackToCart }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(2);
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    district: 'Dhaka',
    thana: '',
    postcode: '',
    instructions: '',
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  const { cart, clearCart, getCartTotal } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const t = useT();

  // Restore saved delivery address from sessionStorage (survives auth redirect)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('medcore_checkout_address');
      if (saved) {
        setDeliveryAddress(JSON.parse(saved));
        sessionStorage.removeItem('medcore_checkout_address');
      }
    } catch {
      // ignore
    }
  }, []);

  // Pre-fill delivery address from user profile
  useEffect(() => {
    if (user) {
      setDeliveryAddress(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
        ...(user.addresses?.[0] && {
          street: prev.street || user.addresses[0].street || '',
          district: prev.district !== 'Dhaka' ? prev.district : (user.addresses[0].district || 'Dhaka'),
          thana: prev.thana || user.addresses[0].thana || '',
          postcode: prev.postcode || user.addresses[0].postcode || '',
        }),
      }));
    }
  }, [user]);

  useEffect(() => {
    if (cart.length > 0) {
      GA4Tracker.trackBeginCheckout(cart, getCartTotal());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deliveryFee = useMemo(() => getDeliveryFee(selectedDelivery), [selectedDelivery]);

  const orderTotal = useMemo(() => {
    const sub = getCartTotal();
    const discount = appliedCoupon?.discountAmount || 0;
    const pointsDiscount = redeemedPoints || 0;
    return Math.round((sub - discount - pointsDiscount + deliveryFee) * 100) / 100;
  }, [getCartTotal, appliedCoupon, redeemedPoints, deliveryFee]);

  const handlePlaceOrder = useCallback(async () => {
    if (!isAuthenticated()) {
      // Save address so it survives the auth flow
      try {
        sessionStorage.setItem('medcore_checkout_address', JSON.stringify(deliveryAddress));
      } catch {
        // ignore
      }
      setShowAuthGate(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        items: cart.map((item) => ({
          product: item.id || item._id,
          qty: item.quantity,
          quantity: item.quantity,
          price: item.price || 0,
        })),
        deliveryType: selectedDelivery,
        deliveryMethod: selectedDelivery,
        paymentMethod: selectedPayment,
        deliveryAddress: {
          name: deliveryAddress.fullName,
          phone: deliveryAddress.phone,
          street: deliveryAddress.street,
          thana: deliveryAddress.thana,
          district: deliveryAddress.district,
          postcode: deliveryAddress.postcode,
          instructions: deliveryAddress.instructions,
        },
        ...(appliedCoupon && { promoCode: appliedCoupon.code }),
      };

      const response = await api.createOrder(orderData);
      const orderNumber =
        response.order.orderNumber || response.order.orderId || `ORD-${response.order._id}`;
      const mongoId = response.order._id || response.order.id;

      setCreatedOrderId(mongoId);
      setOrderId(orderNumber);

      // COD doesn't need payment modal - directly confirm order
      if (selectedPayment === 'cod') {
        GA4Tracker.trackPurchase({
          orderId: orderNumber,
          total: orderTotal,
          deliveryFee,
          items: cart.map((item) => ({
            product: item.id,
            name: item.name,
            price: item.price || 0,
            quantity: item.quantity,
          })),
          paymentMethod: 'cod',
        });
        setIsConfirmed(true);
        clearCart();
      } else if (['bkash', 'nagad', 'b2b_credit'].includes(selectedPayment)) {
        setShowPaymentModal(true);
      } else {
        GA4Tracker.trackPurchase({
          orderId: orderNumber,
          total: orderTotal,
          deliveryFee,
          items: cart.map((item) => ({
            product: item.id,
            name: item.name,
            price: item.price || 0,
            quantity: item.quantity,
          })),
          paymentMethod: selectedPayment,
        });
        setIsConfirmed(true);
        clearCart();
      }
    } catch (err) {
      // Log full error details to console for debugging
      console.error('[Checkout] Order failed:', err.message, err.data || err);
      if (err.data?.errors) {
        console.error('[Checkout] Validation errors:', err.data.errors);
      }
      setError(err.data?.errors?.length ? err.data.errors : err.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    cart,
    clearCart,
    orderTotal,
    deliveryFee,
    isAuthenticated,
    selectedDelivery,
    selectedPayment,
    deliveryAddress,
    appliedCoupon,
  ]);

  const handlePaymentSuccess = useCallback(() => {
    GA4Tracker.trackPurchase({
      orderId,
      total: orderTotal,
      deliveryFee,
      items: cart.map((item) => ({
        product: item.id,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity,
      })),
      paymentMethod: selectedPayment,
    });
    setIsConfirmed(true);
    clearCart();
    setShowPaymentModal(false);
  }, [cart, clearCart, orderId, orderTotal, deliveryFee, selectedPayment]);

  // Show auth gate overlay when user tries to place order without being logged in
  if (showAuthGate && !isAuthenticated()) {
    return (
      <CheckoutAuthGate
        onSuccess={() => setShowAuthGate(false)}
        onBack={() => setShowAuthGate(false)}
      />
    );
  }

  if (cart.length === 0 && !isConfirmed) {
    return (
      <div className="min-h-[60vh] bg-[#F6F9FC] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm bg-white rounded-2xl border border-[#E5E7EB] p-8">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-lg font-bold text-[#0B2545] mb-2">{t('cart.empty')}</h2>
          <p className="text-sm text-[#6B7280] mb-6">{t('cart.emptyDesc')}</p>
          <Link
            href="/products"
            className="inline-block w-full py-3 rounded-xl bg-[#0E8A6E] text-white text-sm font-bold hover:bg-[#0a7560]"
          >
            {t('product.browseProducts')}
          </Link>
        </div>
      </div>
    );
  }

  const cartItems = cart.map((item) => {
    const img = item.images?.[0];
    const imageUrl = typeof img === 'string' ? img : img?.url;
    return {
      id: item.id,
      name: item.name,
      brand: item.brand,
      quantity: item.quantity,
      price: item.price || 0,
      images: item.images,
      imageUrl: imageUrl?.startsWith('http') ? imageUrl : null,
      categoryId: item.categoryId,
    };
  });

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Don't render checkout if not authenticated
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] pb-24 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] hover:text-[#0E8A6E] mb-2"
            >
              <FaArrowLeft size={11} />
              {t('checkout.backToCart')}
            </Link>
            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0B2545] m-0 font-[family-name:var(--font-lora)]">
              {t('checkout.title')}
            </h1>
          </div>
        </div>

        {!isConfirmed ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 lg:gap-6 items-start">
            <div className="space-y-4 min-w-0">
              <CheckoutSteps currentStep={currentStep} itemCount={cart.length} />

              {error && (
                <div
                  role="alert"
                  className="px-4 py-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-sm space-y-1"
                >
                  {Array.isArray(error) ? (
                    error.map((e, i) => (
                      <div key={i}>
                        <span className="font-semibold">{e.field}:</span> {e.message}
                      </div>
                    ))
                  ) : (
                    <div>{error}</div>
                  )}
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
                orderTotal={orderTotal}
              />

              <div className="hidden lg:flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => (onBackToCart ? onBackToCart() : router.push('/cart'))}
                  className="px-5 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#0B2545] hover:bg-[#F9FAFB]"
                >
                  {t('checkout.backToCart')}
                </button>
              </div>
            </div>

            <aside>
              <OrderSummary
                items={cartItems}
                deliveryMethod={selectedDelivery}
                appliedCoupon={appliedCoupon}
                onCouponApply={setAppliedCoupon}
                userId={user?.id || user?._id}
                total={orderTotal}
                onPlaceOrder={handlePlaceOrder}
                loading={loading}
                showPlaceOrder
                loyaltyPoints={user?.loyaltyPoints || 0}
                redeemedPoints={redeemedPoints}
                onRedeemPoints={setRedeemedPoints}
              />
            </aside>
          </div>
        ) : (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8">
            <OrderConfirmation
              orderId={orderId || 'ORD-XXXX'}
              mongoId={createdOrderId}
              estimatedDelivery="2–5 business days"
              paymentMethod={selectedPayment}
            />
          </div>
        )}
      </div>

      {!isConfirmed && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-[500] bg-white border-t border-[#E5E7EB] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[12px] text-[#6B7280]">{t('checkout.total')}</span>
            <span className="text-lg font-bold text-[#0B2545]">৳{orderTotal.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#0E8A6E] hover:bg-[#0a7560] text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="small" />
                {t('checkout.processing')}
              </>
            ) : (
              `${t('checkout.placeOrder')} · ৳${orderTotal.toLocaleString()}`
            )}
          </button>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={orderTotal}
        orderId={createdOrderId}
        selectedMethod={selectedPayment}
        onSuccess={handlePaymentSuccess}
        onError={(err) => setError(err?.message || 'Payment failed')}
      />
    </div>
  );
}
