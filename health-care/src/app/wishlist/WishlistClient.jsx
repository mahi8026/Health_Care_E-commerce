'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
  import WishlistButton from '@/components/wishlist/WishlistButton';
  import Spinner, { ProductCardSkeleton } from '@/components/ui/Spinner';
  import { EmptyWishlist } from '@/components/ui/EmptyState';

export default function WishlistClient() {
  const router = useRouter();
  const { wishlist, wishlistCount, loading, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=/wishlist');
    }
  }, [isAuthenticated, router]);

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  // Navigate to the correct product URL (slug preferred)
  const goToProduct = (product) => {
    router.push(`/products/${product.slug || product._id}`);
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-64 mb-2 animate-shimmer" />
          <div className="h-4 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-48 animate-shimmer" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {[...Array(10)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
          My Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Save your favorite products for later
        </p>
      </div>

      {/* Empty State */}
      {wishlistCount === 0 ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <EmptyWishlist />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {wishlist.map((product) => {
            const primaryImage =
              product.images?.find((img) => typeof img === 'object' && img.isPrimary) ||
              product.images?.[0];
            const imageUrl = primaryImage
              ? typeof primaryImage === 'string'
                ? primaryImage
                : primaryImage.url
              : null;
            const brandName =
              typeof product.brand === 'object' ? product.brand?.name : product.brand;
            const imageAlt = `${product.name}${brandName ? ` — ${brandName}` : ''} — MediportBD Bangladesh`;

            return (
              <div
                key={product._id}
                className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div
                  onClick={() => goToProduct(product)}
                  className="h-[180px] bg-[var(--color-background-secondary)] flex items-center justify-center relative flex-shrink-0 overflow-hidden cursor-pointer"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-5xl text-[var(--color-text-tertiary)] bg-[var(--color-background-tertiary)]">
                      🏥
                    </div>
                  )}

                  {/* Wishlist toggle */}
                  <div className="absolute top-2 right-2">
                    <WishlistButton productId={product._id} size="small" />
                  </div>

                  {/* Out of stock badge */}
                  {product.stock === 0 && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-xs px-2 py-1 rounded bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] font-medium">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 flex-1 flex flex-col">
                  {/* Brand */}
                  <div className="text-xs text-brand-teal font-medium uppercase tracking-[0.5px] mb-1">
                    {brandName}
                  </div>

                  {/* Name */}
                  <div
                    onClick={() => goToProduct(product)}
                    className="text-sm font-medium leading-[1.35] text-[var(--color-text-primary)] mb-2 flex-1 cursor-pointer hover:text-brand-teal line-clamp-2"
                  >
                    {product.name}
                  </div>

                  {/* Rating */}
                  {product.rating?.average > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex gap-[1px]">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-[10px] h-[10px] ${
                              i < Math.round(product.rating.average)
                                ? 'bg-warning'
                                : 'bg-[var(--color-border-secondary)]'
                            }`}
                            style={{
                              clipPath:
                                'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        ({product.rating.count || 0})
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-[family-name:var(--font-lora)] text-lg text-brand-navy font-semibold">
                      ৳{product.price?.toLocaleString()}
                    </span>
                    {product.discount?.percentage > 0 && (
                      <>
                        <span className="text-xs text-[var(--color-text-secondary)] line-through">
                          ৳{product.discount.originalPrice?.toLocaleString()}
                        </span>
                        <span className="text-xs text-brand-teal font-medium">
                          -{product.discount.percentage}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 bg-brand-navy text-white border-none px-3 py-2 rounded-md text-xs font-medium cursor-pointer hover:bg-[var(--color-brand-navy-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="px-3 py-2 bg-transparent text-danger border-[0.5px] border-danger rounded-md text-xs font-medium cursor-pointer hover:bg-[var(--color-status-danger-tint)] transition-colors"
                      title="Remove from wishlist"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
