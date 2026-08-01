'use client';

/**
 * Confetti — Success Celebration Animation
 * 
 * Confetti burst animation for successful actions like:
 * - Order placed
 * - Payment successful
 * - Registration complete
 * - Review submitted
 */

import { useEffect, useState } from 'react';

export default function Confetti({ active = false, duration = 3000, particleCount = 50 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    (async () => {
      if (!active) return;

      // Generate confetti particles
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        endX: Math.random() * 200 - 100, // Pre-calculate horizontal drift
        color: [
          '#FF6B6B', // Red
          '#4ECDC4', // Teal
          '#45B7D1', // Blue
          '#FFA07A', // Orange
          '#98D8C8', // Mint
          '#F7DC6F', // Yellow
          '#BB8FCE', // Purple
          '#85C1E2', // Sky blue
        ][Math.floor(Math.random() * 8)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1,
      }));

      setParticles(newParticles);

      // Clear after animation
      const timeout = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timeout);
    })();
  }, [active, duration, particleCount]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-toast overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: particle.y,
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: particle.color,
              transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
              animation: `confetti-fall-${particle.id} ${particle.duration}s ease-in ${particle.delay}s forwards, confetti-spin ${particle.duration}s linear infinite`,
            }}
          />
          <style jsx>{`
            @keyframes confetti-fall-${particle.id} {
              to {
                transform: translateY(100vh) translateX(${particle.endX}px);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ))}

      <style jsx>{`
        @keyframes confetti-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * useConfetti hook — Trigger confetti programmatically
 */
export function useConfetti() {
  const [showConfetti, setShowConfetti] = useState(false);

  const celebrate = (duration = 3000) => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, duration);
  };

  return { showConfetti, celebrate };
}

/**
 * ConfettiButton — Button that triggers confetti on click
 */
export function ConfettiButton({ 
  children, 
  onClick, 
  className = '',
  confettiDuration = 3000,
  ...props 
}) {
  const { showConfetti, celebrate } = useConfetti();

  const handleClick = (e) => {
    celebrate(confettiDuration);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <>
      <button onClick={handleClick} className={className} {...props}>
        {children}
      </button>
      <Confetti active={showConfetti} duration={confettiDuration} />
    </>
  );
}
