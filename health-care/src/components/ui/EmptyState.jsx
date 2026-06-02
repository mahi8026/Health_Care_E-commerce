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

import Link from 'next/link';
import Button from './Button';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {/* Icon with float animation */}
      {icon && (
        <div className="text-8xl mb-6 animate-float opacity-40">
          {icon}
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
          {action.href ? (
            <Link href={action.href}>
              <Button variant="primary" size="lg">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="lg" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
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
