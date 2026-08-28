/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/views/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'brand-navy': '#0b2545',
        'brand-teal': '#0b7a60',
        'brand-teal-light': '#4ddbb8',
        'brand-teal-tint': '#e1f5ee',
        
        // Page backgrounds
        'page': 'var(--color-background-page)',
        'page-top': 'var(--color-background-page-top)',
        'surface': 'var(--color-background-primary)',
        'surface-subtle': 'var(--color-background-secondary)',
        'surface-muted': 'var(--color-background-muted)',
        'surface-inset': 'var(--color-background-inset)',

        // Background token utilities
        'background-primary': 'var(--color-background-primary)',
        'background-secondary': 'var(--color-background-secondary)',
        'background-tertiary': 'var(--color-background-tertiary)',
        'background-muted': 'var(--color-background-muted)',
        'background-elevated': 'var(--color-background-elevated)',
        'background-inset': 'var(--color-background-inset)',

        // Text token utilities
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',

        // Border token utilities
        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'border-tertiary': 'var(--color-border-tertiary)',

        // Semantic status colors
        'success': '#16a34a',
        'danger': '#e24b4a',
        'warning': '#f59e0b',

        // AA-safe "ink" colors for text/icons placed ON the status colors
        // (white on warning #f59e0b measures 1.97:1 — unreadable).
        'warning-ink': '#451a03',
        'success-ink': '#052e16',
        'danger-ink': '#7f1d1d',

        // Semantic status tint surfaces
        'success-tint': 'var(--color-status-success-tint)',
        'danger-tint': 'var(--color-status-danger-tint)',
        'warning-tint': 'var(--color-status-warning-tint)',

        // Semantic status info
        'info': 'var(--color-status-info)',
        'info-tint': 'var(--color-status-info-tint)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      screens: {
        'xs': '480px',
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
      },
      zIndex: {
        'sticky': '500',
        'dropdown': '700',
        'modal': '800',
        'header': '900',
        'bottom-nav': '1000',
        'drawer': '1100',
        'toast': '10000',
      },
      animation: {
        // Spinner animations
        'spin-slow': 'spin 3s linear infinite',
        'heartbeat-1': 'heartbeat 1.2s ease-in-out infinite',
        'heartbeat-2': 'heartbeat 1.2s ease-in-out 0.1s infinite',
        'heartbeat-3': 'heartbeat 1.2s ease-in-out 0.2s infinite',
        'heartbeat-4': 'heartbeat 1.2s ease-in-out 0.3s infinite',
        'heartbeat-5': 'heartbeat 1.2s ease-in-out 0.4s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-in',
        // UI kit micro-interactions
        'ripple': 'ripple 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'heart-beat': 'heartBeat 0.6s ease-in-out',
        'cart-bounce': 'cartBounce 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-out forwards',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scaleY(0.3)', opacity: '0.5' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.25)' },
          '50%': { transform: 'scale(1)' },
          '75%': { transform: 'scale(1.1)' },
        },
        cartBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-8px)' },
          '70%': { transform: 'translateY(2px)' },
          '90%': { transform: 'translateY(-1px)' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
