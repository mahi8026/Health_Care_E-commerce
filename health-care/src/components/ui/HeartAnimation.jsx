'use client';

/**
 * HeartAnimation — Animated Heart for Wishlist
 * 
 * Heart icon that animates on click with pop effect and fill transition.
 * Used for wishlist add/remove actions.
 */

import { useState } from 'react';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

export default function HeartAnimation({ 
  isFavorite, 
  onToggle, 
  className = '',
  size = 'w-5 h-5',
  showParticles = true
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);

    // Create particle effect when adding to favorites
    if (!isFavorite && showParticles) {
      createParticles(e);
    }

    // Call parent handler
    if (onToggle) {
      onToggle();
    }
  };

  const createParticles = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      angle: (i * 360) / 8,
      x: centerX,
      y: centerY,
    }));

    setParticles(newParticles);

    setTimeout(() => {
      setParticles([]);
    }, 1000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          relative transition-all duration-200
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-[var(--color-status-danger)] focus:ring-offset-2
          ${isAnimating ? 'animate-heart-beat' : ''}
          ${className}
        `}
        aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
        title={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {isFavorite ? (
          <FaHeart 
            className={`${size} text-[var(--color-status-danger)] transition-all duration-300`} 
          />
        ) : (
          <FiHeart 
            className={`${size} text-[var(--color-text-secondary)] hover:text-[var(--color-status-danger)] transition-colors duration-200`} 
          />
        )}
      </button>

      {/* Particle effects */}
      {showParticles && particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-toast">
          {particles.map((particle) => {
            const distance = 40;
            const radians = (particle.angle * Math.PI) / 180;
            const endX = particle.x + Math.cos(radians) * distance;
            const endY = particle.y + Math.sin(radians) * distance;

            return (
              <div
                key={particle.id}
                className="absolute w-2 h-2 bg-[var(--color-status-danger-tint)] rounded-full animate-fade-out"
                style={{
                  left: particle.x,
                  top: particle.y,
                  transform: `translate(-50%, -50%) translate(${endX - particle.x}px, ${endY - particle.y}px)`,
                  opacity: 0,
                  transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * HeartAnimationCompact — Smaller version without particles
 */
export function HeartAnimationCompact({ 
  isFavorite, 
  onToggle, 
  className = ''
}) {
  return (
    <HeartAnimation
      isFavorite={isFavorite}
      onToggle={onToggle}
      className={className}
      size="w-4 h-4"
      showParticles={false}
    />
  );
}
