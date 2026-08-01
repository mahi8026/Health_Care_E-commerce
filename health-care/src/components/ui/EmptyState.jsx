/**
 * Empty State Component
 * 
 * Usage:
 * <EmptyState 
 *   icon="🛒"
 *   title="Your cart is empty"
 *   description="Add some products to get started!"
 *   action={{ label: "Browse Products", href: "/products" }}
 * />
 */

import Button from './Button';

const STATE_ICONS = {
  '🛒': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  '❤️': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  '📦': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  '🔍': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  '⚖️': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M12 3v18" /><path d="M8 21h8" /><path d="M12 7l-8 4 4 6 4-2" /><path d="M12 7l8 4-4 6-4-2" />
    </svg>
  ),
  '🔬': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M11 2v6" /><path d="M13 2v6" /><path d="M7 8h10" /><path d="M12 8v4" />
      <path d="M12 12l7.5 7.5a2 2 0 0 1 0 3 2 2 0 0 1-3 0L12 15.5" />
      <path d="M9.5 15.5l-1.5 1.5a2 2 0 0 0 0 3 2 2 0 0 0 3 0L14 16.5" />
    </svg>
  ),
  '🏥': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M10 21v-4h4v4" /><path d="M10 11h4" /><path d="M12 9v4" />
    </svg>
  ),
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  className = '',
}) {
  const renderIcon = STATE_ICONS[icon] || icon;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="w-16 h-16 mb-6 text-[var(--color-text-tertiary)]" aria-hidden="true">
          {typeof renderIcon === 'string' ? (
            <span className="text-5xl block">{renderIcon}</span>
          ) : (
            renderIcon
          )}
        </div>
      )}

      {/* Title */}
      {title && (
        <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3 animate-slide-up">
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className="text-base text-[var(--color-text-secondary)] mb-8 max-w-md animate-slide-up" style={{ animationDelay: '100ms' }}>
          {description}
        </p>
      )}

      {/* Action button */}
      {action && (
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Button
            variant="primary"
            size="lg"
            {...(action.href ? { href: action.href } : { onClick: action.onClick })}
          >
            {action.label}
          </Button>
        </div>
      )}

      {/* Custom children */}
      {children}
    </div>
  );
}

// Preset empty states
export function EmptyCart() {
  return (
    <EmptyState
      icon="🛒"
      title="Your cart is empty"
      description="Looks like you haven't added any medical equipment yet. Browse our products and find what you need!"
      action={{ label: "Browse Products", href: "/products" }}
    />
  );
}

export function EmptyWishlist() {
  return (
    <EmptyState
      icon="❤️"
      title="Your wishlist is empty"
      description="Save your favorite products here for easy access later!"
      action={{ label: "Explore Products", href: "/products" }}
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon="📦"
      title="No orders yet"
      description="You haven't placed any orders. Start shopping and your orders will appear here!"
      action={{ label: "Start Shopping", href: "/products" }}
    />
  );
}

export function NoSearchResults({ query }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`We couldn't find any products matching "${query}". Try different keywords or browse our categories.`}
      action={{ label: "View All Products", href: "/products" }}
    />
  );
}

export function EmptyCompare() {
  return (
    <EmptyState
      icon="⚖️"
      title="No products to compare"
      description="Add products to your compare list to see them side by side."
      action={{ label: "Browse Products", href: "/products" }}
    />
  );
}
