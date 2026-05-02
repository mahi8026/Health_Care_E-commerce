"use client";

import Spinner from '@/components/ui/Spinner';

export default function SearchResults({ products, loading, query, onProductClick, hasMore, onLoadMore, loadingMore, totalProducts }) {
  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 md:py-20">
        <div className="text-[40px] md:text-[48px] mb-4">🔍</div>
        <h3 className="text-[16px] md:text-[18px] font-semibold mb-2 font-[family-name:var(--font-lora)]">
          No products found
        </h3>
        <p className="text-[12px] md:text-[13px] text-[var(--color-text-secondary)] mb-6">
          {query ? `No results for "${query}"` : 'Try adjusting your filters'}
        </p>
        <button className="px-6 py-3 bg-[#0B2545] text-white rounded-lg text-[13px] font-medium hover:bg-[#0d2d52] transition-colors">
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Results Header */}
      <div className="mb-4">
        <div className="text-[12px] md:text-[13px] text-[var(--color-text-secondary)]">
          Showing {products.length} of {totalProducts || products.length} {totalProducts === 1 ? 'product' : 'products'}
          {query && <span> for "{query}"</span>}
        </div>
      </div>

      {/* Product Grid - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((product) => {
          // Calculate savings and discount percentage
          const price = product.price || 0;
          const oldPrice = product.oldPrice || 0;
          const savings = oldPrice > price ? oldPrice - price : 0;
          const discountPercent = oldPrice > 0 ? Math.round((savings / oldPrice) * 100) : 0;
          const hasDiscount = savings > 0 && discountPercent > 0;

          return (
            <div
              key={product.id || product._id}
              onClick={() => onProductClick && onProductClick(product._id || product.id)}
              className="bg-white rounded-lg p-2.5 md:p-4 border-[0.5px] border-[var(--color-border-tertiary)] hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Save Badge */}
              {hasDiscount && (
                <div className="flex justify-start mb-2">
                  <span className="text-[9px] md:text-[10px] px-2 md:px-3 py-1 md:py-1.5 rounded-md font-semibold bg-[#7C3AED] text-white shadow-sm">
                    Save: {savings.toLocaleString()}৳ (-{discountPercent}%)
                  </span>
                </div>
              )}

              {product.badge && !hasDiscount && (
                <div className="flex justify-end mb-2">
                  <span className={`text-[8px] md:text-[9px] px-2 py-[2px] rounded font-medium ${
                    product.badge === 'sale'
                      ? 'bg-[#FCEBEB] text-[#791F1F]'
                      : 'bg-[#E1F5EE] text-[#085041]'
                  }`}>
                    {product.badge === 'sale' ? '🔥 SALE' : '✨ NEW'}
                  </span>
                </div>
              )}
              
              {/* Product Image */}
              <div className="w-full h-28 md:h-32 bg-[var(--color-background-tertiary)] rounded-lg mb-2 md:mb-3 flex items-center justify-center text-[32px] md:text-[40px]">
                {(() => {
                  // Handle both old (string) and new (object) image formats
                  const imageData = product.images?.[0];
                  const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
                  
                  return imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={imageUrl} 
                      alt={typeof imageData === 'object' ? imageData.alt : product.name}
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.innerHTML = '📦';
                      }}
                    />
                  ) : '📦';
                })()}
              </div>
              
              {/* Product Name */}
              <div className="text-[11px] md:text-[13px] font-medium mb-1 font-[family-name:var(--font-plus-jakarta)] line-clamp-2">
                {product.name}
              </div>
              
              {/* Brand */}
              <div className="text-[10px] md:text-[11px] text-[var(--color-text-secondary)] mb-2 md:mb-3">
                {typeof product.brand === 'object' ? product.brand?.name : product.brand}
              </div>
              
              {/* Price and Stock */}
              <div className="flex items-end justify-between mb-2 md:mb-3">
                <div>
                  <div className="text-[14px] md:text-[16px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                    ৳{product.price.toLocaleString()}
                  </div>
                  {product.oldPrice && (
                    <div className="text-[10px] md:text-[11px] text-[var(--color-text-tertiary)] line-through">
                      ৳{product.oldPrice.toLocaleString()}
                    </div>
                  )}
                </div>
                {product.stock !== undefined && (
                  <div className={`text-[9px] md:text-[10px] ${product.stock > 0 ? 'text-[#0E8A6E]' : 'text-[#E24B4A]'}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                )}
              </div>
              
              {/* View Details Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onProductClick && onProductClick(product._id || product.id);
                }}
                className="w-full py-[7px] md:py-[8px] bg-[#0B2545] text-white rounded-lg text-[11px] md:text-[12px] font-semibold hover:bg-[#0d2d52] transition-colors"
              >
                View details
              </button>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-[#0E8A6E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#0c7359] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <Spinner size="sm" />
                Loading...
              </>
            ) : (
              'Load More Products'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
