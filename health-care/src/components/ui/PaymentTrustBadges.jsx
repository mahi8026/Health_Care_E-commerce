/**
 * Payment Trust Badges for Bangladesh Market
 * 
 * Displays bKash, Nagad, and other payment method logos
 * Critical for Bangladesh market where payment trust is a top concern
 * 
 * Usage:
 * - Footer (always visible)
 * - Checkout page (before payment)
 * - Product pages (build trust)
 */

'use client';

import Image from 'next/image';

export default function PaymentTrustBadges({ 
  variant = 'default', // 'default' | 'compact' | 'checkout'
  showTitle = true 
}) {
  const paymentMethods = [
    {
      name: 'bKash',
      logo: '/images/payment/bkash-logo.png',
      alt: 'bKash Payment - Bangladesh\'s most trusted mobile banking',
      percentage: '25%', // 25% of Bangladeshis use bKash
    },
    {
      name: 'Nagad',
      logo: '/images/payment/nagad-logo.png',
      alt: 'Nagad Payment - Government-backed digital payment',
      percentage: '8%',
    },
    {
      name: 'Cash on Delivery',
      logo: '/images/payment/cod-icon.png',
      alt: 'Cash on Delivery - Pay when you receive',
      percentage: '60%', // 60% prefer COD in Bangladesh
    },
    {
      name: 'SSL Commerz',
      logo: '/images/payment/sslcommerz-logo.png',
      alt: 'SSL Commerz - Secure online payment gateway Bangladesh',
      percentage: '5%',
    },
    {
      name: 'Bank Transfer',
      logo: '/images/payment/bank-transfer-icon.png',
      alt: 'Bank Transfer - IBBL, Dutch-Bangla, Brac Bank supported',
      percentage: '2%',
    },
  ];

  const getSizeClasses = () => {
    switch (variant) {
      case 'compact':
        return 'h-8 w-auto';
      case 'checkout':
        return 'h-12 w-auto';
      default:
        return 'h-10 w-auto';
    }
  };

  const getContainerClasses = () => {
    switch (variant) {
      case 'compact':
        return 'gap-2';
      case 'checkout':
        return 'gap-4';
      default:
        return 'gap-3';
    }
  };

  return (
    <div className="payment-trust-badges">
      {showTitle && (
        <div className="text-center mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            {variant === 'checkout' ? 'We Accept' : 'Safe & Secure Payment'}
          </h3>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Choose your preferred payment method
          </p>
        </div>
      )}

      <div className={`flex flex-wrap items-center justify-center ${getContainerClasses()}`}>
        {paymentMethods.map((method) => (
          <div
            key={method.name}
            className="payment-badge group relative"
            title={`${method.name} - ${method.alt}`}
          >
            {/* Payment Method Logo Placeholder */}
            <div className={`bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:border-[var(--color-brand-navy)] transition-all duration-200 ${getSizeClasses()}`}>
              {/* Temporary: Using text until actual logos are added */}
              <div className="flex items-center justify-center h-full px-3">
                <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                  {method.name}
                </span>
              </div>
              {/* TODO: Replace with actual Image component when logos are available */}
              {/* 
              <Image
                src={method.logo}
                alt={method.alt}
                width={variant === 'checkout' ? 80 : 60}
                height={variant === 'checkout' ? 48 : 40}
                className="object-contain"
              />
              */}
            </div>

            {/* Tooltip on hover (desktop only) */}
            {variant !== 'compact' && (
              <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {method.alt}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trust Signals */}
      {variant === 'checkout' && (
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>PCI Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>COD Available</span>
          </div>
        </div>
      )}

      {/* Bangladesh-specific payment note */}
      {variant === 'default' && (
        <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-2">
          bKash, Nagad, and Cash on Delivery available nationwide
        </p>
      )}
    </div>
  );
}

// Compact version for headers/footers
export function PaymentBadgesCompact() {
  return <PaymentTrustBadges variant="compact" showTitle={false} />;
}

// Checkout version with full details
export function PaymentBadgesCheckout() {
  return <PaymentTrustBadges variant="checkout" showTitle={true} />;
}
