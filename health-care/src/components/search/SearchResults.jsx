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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
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
              className="group bg-white rounded-xl border border-gray-100 hover:border-[#0E8A6E] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Image Container - Fixed height */}
              <div className="relative bg-gray-100 w-full h-44 rounded-t-xl overflow-hidden flex-shrink-0">
                {(() => {
                  const imageData = product.images?.[0];
                  const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
                  
                  return imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={imageUrl} 
                      alt={typeof imageData === 'object' ? imageData.alt : product.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.4s ease'
                      }}
                      className="group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                        e.currentTarget.style.objectFit = 'contain';
                        e.currentTarget.style.padding = '24px';
                        e.currentTarget.style.opacity = '0.4';
                        e.currentTarget.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  );
                })()}
                
                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md shadow-md z-10">
                    <div className="text-xs font-bold">-{discountPercent}%</div>
                  </div>
                )}
                
                {/* New/Sale Badge */}
                {product.badge && !hasDiscount && (
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-md shadow-md text-xs font-bold z-10 ${
                    product.badge === 'sale'
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}>
                    {product.badge === 'sale' ? 'SALE' : 'NEW'}
                  </div>
                )}
                
                {/* Stock Badge */}
                {product.stock !== undefined && (
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-semibold shadow-md z-10 ${
                    product.stock > 0 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-3 md:p-4 flex-1 flex flex-col">
                {/* Brand */}
                <div className="text-[10px] md:text-xs text-[#0E8A6E] font-semibold uppercase tracking-wider mb-1">
                  {typeof product.brand === 'object' ? product.brand?.name : product.brand}
                </div>
                
                {/* Product Name */}
                <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2 line-clamp-2 flex-1 group-hover:text-[#0E8A6E] transition-colors">
                  {product.name}
                </h3>
                
                {/* Price Section */}
                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg md:text-xl font-bold text-gray-900">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {product.oldPrice && (
                      <span className="text-xs md:text-sm text-gray-400 line-through">
                        ৳{product.oldPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Savings Display */}
                  {hasDiscount && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg px-2 py-1 mb-3">
                      <span className="text-xs font-semibold text-purple-700">
                        💰 Save ৳{savings.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductClick && onProductClick(product._id || product.id);
                    }}
                    className="w-full bg-gradient-to-r from-[#0E8A6E] to-[#0c7359] text-white py-2.5 md:py-3 rounded-lg font-semibold text-xs md:text-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="group relative px-10 py-4 bg-gradient-to-r from-[#0E8A6E] to-[#0c7359] text-white rounded-xl text-[15px] font-bold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c7359] to-[#0E8A6E] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Content */}
            <span className="relative z-10 flex items-center gap-3">
              {loadingMore ? (
                <>
                  <Spinner size="sm" />
                  Loading More Products...
                </>
              ) : (
                <>
                  Load More Products
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
