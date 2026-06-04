'use client';

/**
 * FlyToCart Animation — Product Image Flies to Cart Icon
 * 
 * Creates a delightful animation when adding items to cart.
 * The product image clones itself and flies to the cart icon in the header.
 * 
 * Usage:
 *   <button onClick={() => flyToCart(productImageRef.current)}>
 *     Add to Cart
 *   </button>
 */

import { useState, useEffect } from 'react';

let animationQueue = [];
let isAnimating = false;

export function useFlyToCart() {
  const [flyingImages, setFlyingImages] = useState([]);

  const flyToCart = (sourceElement, productImage) => {
    if (!sourceElement) return;

    // Find cart icon (adjust selector based on your cart icon)
    const cartIcon = document.querySelector('[data-cart-icon]') || 
                     document.querySelector('.cart-icon') ||
                     document.querySelector('[aria-label*="cart" i]');
    
    if (!cartIcon) {
      console.warn('Cart icon not found for fly animation');
      return;
    }

    // Get positions
    const sourceRect = sourceElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    // Create flying image data
    const flyingImage = {
      id: Date.now() + Math.random(),
      src: productImage || sourceElement.src || sourceElement.querySelector('img')?.src,
      startX: sourceRect.left + sourceRect.width / 2,
      startY: sourceRect.top + sourceRect.height / 2,
      endX: cartRect.left + cartRect.width / 2,
      endY: cartRect.top + cartRect.height / 2,
    };

    // Add to state
    setFlyingImages(prev => [...prev, flyingImage]);

    // Make cart icon bounce
    if (cartIcon) {
      cartIcon.classList.add('animate-cart-bounce');
      setTimeout(() => {
        cartIcon.classList.remove('animate-cart-bounce');
      }, 600);
    }

    // Remove after animation completes
    setTimeout(() => {
      setFlyingImages(prev => prev.filter(img => img.id !== flyingImage.id));
    }, 1000);
  };

  return { flyToCart, flyingImages };
}

export function FlyToCartContainer() {
  const [flyingImages, setFlyingImages] = useState([]);

  useEffect(() => {
    // Listen for fly-to-cart events
    const handleFlyToCart = (event) => {
      const { sourceElement, productImage } = event.detail;
      
      const cartIcon = document.querySelector('[data-cart-icon]');
      if (!cartIcon || !sourceElement) return;

      const sourceRect = sourceElement.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      const flyingImage = {
        id: Date.now() + Math.random(),
        src: productImage || sourceElement.src || sourceElement.querySelector('img')?.src,
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
        endX: cartRect.left + cartRect.width / 2,
        endY: cartRect.top + cartRect.height / 2,
      };

      setFlyingImages(prev => [...prev, flyingImage]);

      // Animate cart icon
      cartIcon.classList.add('animate-cart-bounce');
      setTimeout(() => {
        cartIcon.classList.remove('animate-cart-bounce');
      }, 600);

      // Remove after animation
      setTimeout(() => {
        setFlyingImages(prev => prev.filter(img => img.id !== flyingImage.id));
      }, 1000);
    };

    window.addEventListener('fly-to-cart', handleFlyToCart);
    return () => window.removeEventListener('fly-to-cart', handleFlyToCart);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {flyingImages.map((image) => (
        <div
          key={image.id}
          className="absolute transition-all duration-1000 ease-out pointer-events-none"
          style={{
            left: image.startX,
            top: image.startY,
            transform: `translate(-50%, -50%) translate(${image.endX - image.startX}px, ${image.endY - image.startY}px) scale(0.2)`,
            opacity: 0,
          }}
        >
          {image.src && (
            <img
              src={image.src}
              alt="Flying to cart"
              className="w-20 h-20 object-cover rounded-lg shadow-2xl"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Helper function to trigger fly-to-cart animation from anywhere
 * 
 * @param {HTMLElement} sourceElement - The product image or button element
 * @param {string} productImage - Optional product image URL
 */
export function triggerFlyToCart(sourceElement, productImage = null) {
  const event = new CustomEvent('fly-to-cart', {
    detail: { sourceElement, productImage }
  });
  window.dispatchEvent(event);
}
