/**
 * AutoSlider Usage Examples
 * 
 * This file demonstrates various ways to use the AutoSlider component
 */

import AutoSlider from './AutoSlider';
import Image from 'next/image';

// ============================================================================
// EXAMPLE 1: Basic Product Slider (GoWell BD Style)
// ============================================================================
export function BasicProductSlider({ products }) {
  return (
    <AutoSlider
      autoPlayInterval={4000}
      itemsToShow={6}
      itemsToScroll={1}
      gap="16px"
      pauseOnHover={true}
      showArrows={true}
      loop={true}
    >
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <div className="product-image">
            <Image src={product.image} alt={product.name} fill />
            {product.isNew && <span className="badge-new">New</span>}
            {product.discount && <span className="badge-discount">-{product.discount}%</span>}
          </div>
          <div className="product-info">
            <h3>{product.name}</h3>
            <p className="price">৳{product.price.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </AutoSlider>
  );
}

// ============================================================================
// EXAMPLE 2: Category Slider (Show 4 items on desktop)
// ============================================================================
export function CategorySlider({ categories }) {
  return (
    <AutoSlider
      autoPlayInterval={5000}
      itemsToShow={4}
      itemsToScroll={1}
      gap="24px"
      pauseOnHover={true}
      showArrows={true}
      loop={true}
    >
      {categories.map((category) => (
        <div key={category.id} className="category-card">
          <div className="category-icon">{category.icon}</div>
          <h3>{category.name}</h3>
          <p>{category.productCount} products</p>
        </div>
      ))}
    </AutoSlider>
  );
}

// ============================================================================
// EXAMPLE 3: Brand Logo Slider (Show 8 logos, scroll 3 at a time)
// ============================================================================
export function BrandLogoSlider({ brands }) {
  return (
    <AutoSlider
      autoPlayInterval={3000}
      itemsToShow={8}
      itemsToScroll={3}
      gap="32px"
      pauseOnHover={true}
      showArrows={false} // Hide arrows for clean look
      loop={true}
    >
      {brands.map((brand) => (
        <div key={brand.id} className="brand-logo">
          <Image 
            src={brand.logo} 
            alt={brand.name}
            width={120}
            height={60}
            style={{ objectFit: 'contain' }}
          />
        </div>
      ))}
    </AutoSlider>
  );
}

// ============================================================================
// EXAMPLE 4: Testimonial Slider (Show 1 item, auto-play slow)
// ============================================================================
export function TestimonialSlider({ testimonials }) {
  return (
    <AutoSlider
      autoPlayInterval={8000}
      itemsToShow={1}
      itemsToScroll={1}
      gap="0px"
      pauseOnHover={true}
      showArrows={true}
      loop={true}
    >
      {testimonials.map((testimonial) => (
        <div key={testimonial.id} className="testimonial-card">
          <p className="quote">&ldquo;{testimonial.quote}&rdquo;</p>
          <div className="author">
            <Image 
              src={testimonial.avatar} 
              alt={testimonial.name}
              width={50}
              height={50}
              style={{ borderRadius: '50%' }}
            />
            <div>
              <p className="name">{testimonial.name}</p>
              <p className="role">{testimonial.role}</p>
            </div>
          </div>
        </div>
      ))}
    </AutoSlider>
  );
}

// ============================================================================
// EXAMPLE 5: Deal Products Slider (Fast auto-play, show 5 items)
// ============================================================================
export function DealSlider({ deals }) {
  return (
    <AutoSlider
      autoPlayInterval={2500}
      itemsToShow={5}
      itemsToScroll={2}
      gap="20px"
      pauseOnHover={true}
      showArrows={true}
      loop={true}
    >
      {deals.map((deal) => (
        <div key={deal.id} className="deal-card">
          <div className="deal-badge">
            <span className="discount">-{deal.discountPercent}%</span>
            <span className="timer">Ends in {deal.timeLeft}</span>
          </div>
          <Image src={deal.image} alt={deal.name} width={200} height={200} />
          <h3>{deal.name}</h3>
          <div className="pricing">
            <span className="current-price">৳{deal.currentPrice}</span>
            <span className="old-price">৳{deal.oldPrice}</span>
          </div>
        </div>
      ))}
    </AutoSlider>
  );
}

// ============================================================================
// EXAMPLE 6: Image Gallery Slider (Full width, 1 image at a time)
// ============================================================================
export function ImageGallerySlider({ images }) {
  return (
    <AutoSlider
      autoPlayInterval={6000}
      itemsToShow={1}
      itemsToScroll={1}
      gap="0px"
      pauseOnHover={true}
      showArrows={true}
      loop={true}
    >
      {images.map((image, index) => (
        <div key={index} className="gallery-image">
          <Image 
            src={image.url} 
            alt={image.caption}
            fill
            style={{ objectFit: 'cover' }}
            priority={index === 0}
          />
          {image.caption && (
            <div className="caption">{image.caption}</div>
          )}
        </div>
      ))}
    </AutoSlider>
  );
}

// ============================================================================
// EXAMPLE 7: Related Products (No auto-play, manual navigation only)
// ============================================================================
export function RelatedProductsSlider({ products }) {
  return (
    <AutoSlider
      autoPlayInterval={0} // Disable auto-play
      itemsToShow={4}
      itemsToScroll={1}
      gap="16px"
      pauseOnHover={false}
      showArrows={true}
      loop={false}
    >
      {products.map((product) => (
        <div key={product.id} className="related-product">
          <Image src={product.image} alt={product.name} width={150} height={150} />
          <h4>{product.name}</h4>
          <p>৳{product.price.toLocaleString()}</p>
        </div>
      ))}
    </AutoSlider>
  );
}

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================
/*
  The AutoSlider automatically adjusts items based on viewport:
  
  - Mobile (<640px): Shows 2 items
  - Tablet (640px - 1024px): Shows 3 items
  - Desktop (>1024px): Shows the number specified in itemsToShow prop
  
  You can override this by wrapping in custom CSS media queries if needed.
*/

// ============================================================================
// CUSTOM STYLING EXAMPLES
// ============================================================================
export function CustomStyledSlider({ items }) {
  return (
    <div className="custom-slider-wrapper">
      <AutoSlider
        autoPlayInterval={4000}
        itemsToShow={5}
        itemsToScroll={1}
        gap="20px"
      >
        {items.map((item) => (
          <div key={item.id} className="custom-item">
            {item.content}
          </div>
        ))}
      </AutoSlider>

      <style jsx>{`
        .custom-slider-wrapper {
          padding: 40px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .custom-item {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: transform 0.3s;
        }

        .custom-item:hover {
          transform: translateY(-8px);
        }

        /* Custom arrow styling */
        :global(.auto-slider-arrow) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border: none !important;
        }

        :global(.auto-slider-dot) {
          background: rgba(255,255,255,0.5) !important;
        }

        :global(.auto-slider-dot[aria-current="true"]) {
          background: white !important;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// PERFORMANCE TIPS
// ============================================================================
/*
  1. Use lazy loading for images inside slider items
  2. Keep itemsToShow reasonable (4-8 max for products)
  3. Set appropriate autoPlayInterval (3000-6000ms recommended)
  4. Use gap="16px" or "20px" for optimal spacing
  5. Enable pauseOnHover for better UX
  6. Disable loop if you have few items (< itemsToShow * 2)
*/

// ============================================================================
// ACCESSIBILITY FEATURES
// ============================================================================
/*
  The AutoSlider includes:
  
  - Keyboard navigation (Arrow Left/Right)
  - Touch/swipe support on mobile
  - ARIA labels for screen readers
  - Pause on hover for better accessibility
  - Focus management
  - Semantic HTML structure
*/
