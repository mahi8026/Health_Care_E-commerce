'use client';

/**
 * ThemeContext — Dark Mode Support
 * 
 * Provides theme (light/dark) state management across the application.
 * Persists user preference in localStorage and applies class to <html> element.
 * 
 * Features:
 * - System preference detection
 * - LocalStorage persistence
 * - Smooth transitions
 * - No flash of unstyled content (FOUC)
 */

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or system preference
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    
    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  
  const [mounted, setMounted] = useState(false);

  // Apply theme class to document on mount and theme changes
  useEffect(() => {
    // Apply initial theme
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setMounted(true);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't set a manual preference
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
