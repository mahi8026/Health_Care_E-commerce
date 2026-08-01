"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import api from '@/utils/api';
import GA4Tracker from '@/services/GA4Tracker';
import { calculateCartItemPrice, isEligibleForB2BPricing } from '@/utils/pricing';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import DeliveryAddress from '@/components/checkout/DeliveryAddress';
import DeliveryOptions from '@/components/checkout/DeliveryOptions';
import PaymentMethods from '@/components/checkout/PaymentMethods';
import OrderSummary, { getDeliveryFee } from '@/components/checkout/OrderSummary';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import PaymentModal from '@/components/payment/PaymentModal';
import Spinner, { ButtonLoader } from '@/components/ui/Spinner';
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
  
  // ✅ Security Fix #4: Generate idempotency key to prevent double charging
  const [idempotencyKey] = useState(() => {
    // Generate once per checkout session (survives re-renders)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `checkout-${timestamp}-${random}`;
  });
  
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
      const saved = sessionStorage.getItem('Mediport_checkout_address');
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDeliveryAddress(JSON.parse(saved));
        sessionStorage.removeItem('Mediport_checkout_address');
      }
    } catch {
      // ignore
    }
  }, []);

  // Pre-fill delivery address from user profile
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const deliveryFee = useMemo(
    () => getDeliveryFee(deliveryAddress?.district || ''),
    [deliveryAddress?.district]
  );

  // Calculate B2B pricing for cart items
  const { b2bSavings, itemsWithB2BPricing } = useMemo(() => {
    const isB2BEligible = isEligibleForB2BPricing(user);
    if (!isB2BEligible) {
      return {
        b2bSavings: 0,
        itemsWithB2BPricing: cart.map(item => ({
          ...item,
          finalPrice: item.price,
          isB2BPrice: false,
        })),
      };
    }

    let totalSavings = 0;
    const pricedItems = cart.map((item) => {
      const b2bPricing = calculateCartItemPrice(item, user, item.category);
      totalSavings += b2bPricing.savings;
      
      return {
        ...item,
        finalPrice: b2bPricing.unitPrice,
        isB2BPrice: b2bPricing.isB2BPrice,
        b2bSavings: b2bPricing.savings,
      };
    });

    return {
      b2bSavings: totalSavings,
      itemsWithB2BPricing: pricedItems,
    };
  }, [cart, user]);

  const orderTotal = useMemo(() => {
    // Use B2B-adjusted prices for subtotal
    const sub = itemsWithB2BPricing.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    const discount = appliedCoupon?.discountAmount || 0;
    // Convert points to taka: 100 points = ৳10, so multiply by 0.1
    const pointsDiscount = (redeemedPoints || 0) * 0.1;
    return Math.round((sub - discount - pointsDiscount + deliveryFee) * 100) / 100;
  }, [itemsWithB2BPricing, appliedCoupon, redeemedPoints, deliveryFee]);

  const handlePlaceOrder = useCallback(async () => {
    if (!isAuthenticated()) {
      // Save address so it survives the auth flow
      try {
        sessionStorage.setItem('Mediport_checkout_address', JSON.stringify(deliveryAddress));
      } catch {
        // ignore
      }
      setShowAuthGate(true);
      return;
    }

    // ── Front-end validation before hitting the API ──────────────────────────
    const BD_PHONE = /^(\+880|880|0)?1[3-9]\d{8}$/;
    const fieldErrors = [];
    if (!deliveryAddress.fullName?.trim() || deliveryAddress.fullName.trim().length < 2)
      fieldErrors.push('Full name must be at least 2 characters');
    if (!deliveryAddress.phone?.trim() || !BD_PHONE.test(deliveryAddress.phone.replace(/[\s\-+]/g, '')))
      fieldErrors.push('Please enter a valid Bangladesh phone number (01XXXXXXXXX)');
    if (!deliveryAddress.street?.trim() || deliveryAddress.street.trim().length < 5)
      fieldErrors.push('Please enter a full street address');
    if (!deliveryAddress.district?.trim())
      fieldErrors.push('District is required');
    if (!deliveryAddress.thana?.trim() || deliveryAddress.thana.trim().length < 2)
      fieldErrors.push('Please enter thana / upazila');
    if (!/^\d{4}$/.test(deliveryAddress.postcode || ''))
      fieldErrors.push('Postcode must be 4 digits');

    if (fieldErrors.length > 0) {
      setError(fieldErrors.map((msg, i) => ({ field: `field-${i}`, message: msg })));
      // Scroll to error
      document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        items: itemsWithB2BPricing.map((item) => ({
          product: item.id || item._id,
          qty: item.quantity,
          quantity: item.quantity,
          price: item.finalPrice || item.price || 0, // Use B2B price if available
          isB2BPrice: item.isB2BPrice || false,
          b2bSavings: item.b2bSavings || 0,
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
        // B2B discount metadata
        b2bDiscount: b2bSavings || 0,
        isB2BOrder: isEligibleForB2BPricing(user),
        // ✅ Security Fix #4: Include idempotency key to prevent duplicate orders
        idempotencyKey,
        ...(appliedCoupon && { promoCode: appliedCoupon.code }),
      };

      const response = await api.createOrder(orderData);
      const orderObj = response.data?.order || response.order || response.data || {};
      
      // ✅ Handle duplicate order response
      if (response.data?.isDuplicate) {
        if (process.env.NODE_ENV === 'development') console.warn('[Checkout] Duplicate order detected, using existing order');
      }
      
      const orderNumber =
        orderObj.orderNumber || orderObj.orderId || `ORD-${orderObj._id}`;
      const mongoId = orderObj._id || orderObj.id;

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
      if (process.env.NODE_ENV === 'development') {
        console.error('[Checkout] Order failed:', err.message, err.data || err);
        if (err.data?.errors) {
          console.error('[Checkout] Validation errors:', err.data.errors);
        }
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
    b2bSavings,
    idempotencyKey,
    itemsWithB2BPricing,
    user,
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
      <div className="min-h-[60vh] bg-[var(--color-background-tertiary)] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm bg-white rounded-2xl border border-[var(--color-border-primary)] p-8">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">{t('cart.empty')}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">{t('cart.emptyDesc')}</p>
          <Link
            href="/products"
            className="inline-block w-full py-3 rounded-xl bg-brand-teal text-white text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)]"
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
    router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-tertiary)] pb-24 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-brand-teal mb-2"
            >
              <FaArrowLeft size={11} />
              {t('checkout.backToCart')}
            </Link>
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary m-0">
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
                  className="px-4 py-3 rounded-xl bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] text-sm space-y-1"
                >
                  {Array.isArray(error) ? (
                    error.map((e) => (
                      <div key={e.field}>
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

              <DeliveryOptions district={deliveryAddress?.district || ''} />

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
                  className="px-5 py-3 rounded-xl border border-[var(--color-border-primary)] bg-white text-sm font-semibold text-brand-navy hover:bg-[var(--color-background-secondary)]"
                >
                  {t('checkout.backToCart')}
                </button>
              </div>
            </div>

            <aside>
              <OrderSummary
                items={cartItems}
                deliveryMethod={selectedDelivery}
                district={deliveryAddress?.district || ''}
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
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[var(--color-border-primary)] p-6 sm:p-8">
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
          className="lg:hidden fixed bottom-0 left-0 right-0 z-sticky bg-white border-t border-[var(--color-border-primary)] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs text-[var(--color-text-secondary)]">{t('checkout.total')}</span>
            <span className="text-lg font-semibold text-brand-navy">৳{orderTotal.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <ButtonLoader />
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
