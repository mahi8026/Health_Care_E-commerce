'use client';

/**
 * ThemeToggle — Dark Mode Toggle Button
 * 
 * Animated toggle button for switching between light and dark themes.
 * Features smooth icon transitions and accessibility support.
 */

import { useTheme } from '@/context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-11 h-11 rounded-full
        flex items-center justify-center
        transition-all duration-300
        hover:scale-110 active:scale-95
        bg-[var(--color-background-tertiary)]
        text-[var(--color-text-primary)]
        hover:bg-[var(--color-background-muted)]
        focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Sun icon (visible in dark mode) */}
      <FiSun
        className={`
          absolute w-5 h-5 transition-all duration-300
          ${theme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-0'
          }
        `}
      />
      
      {/* Moon icon (visible in light mode) */}
      <FiMoon
        className={`
          absolute w-5 h-5 transition-all duration-300
          ${theme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-0'
          }
        `}
      />
    </button>
  );
}

/**
 * ThemeToggleCompact — Smaller version for mobile/compact layouts
 */
export function ThemeToggleCompact({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-11 h-11 rounded-lg
        flex items-center justify-center
        transition-all duration-200
        hover:bg-[var(--color-background-tertiary)]
        text-[var(--color-text-secondary)]
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <FiMoon className="w-4 h-4" />
      ) : (
        <FiSun className="w-4 h-4" />
      )}
    </button>
  );
}
