'use client';

/**
 * RippleButton — Material Design Ripple Effect
 * 
 * Button component with ripple animation on click.
 * Creates a spreading circle effect from the click point.
 */

import { useState, useRef } from 'react';

export default function RippleButton({ 
  children, 
  onClick, 
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.6)',
  ...props 
}) {
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    // Call original onClick
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
          }}
        />
      ))}
    </button>
  );
}

/**
 * RippleDiv — Ripple effect for non-button elements
 */
export function RippleDiv({ 
  children, 
  onClick, 
  className = '',
  rippleColor = 'rgba(24, 175, 169, 0.3)',
  ...props 
}) {
  const [ripples, setRipples] = useState([]);
  const divRef = useRef(null);

  const handleClick = (e) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      ref={divRef}
      onClick={handleClick}
      className={`relative overflow-hidden cursor-pointer ${className}`}
      {...props}
    >
      {children}
      
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
          }}
        />
      ))}
    </div>
  );
}
