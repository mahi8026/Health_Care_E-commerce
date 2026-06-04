/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px', // Extra small breakpoint for better mobile control
      },
      colors: {
        page: 'var(--color-background-page)',
        'page-top': 'var(--color-background-page-top)',
        surface: {
          DEFAULT: 'var(--color-background-primary)',
          subtle: 'var(--color-background-secondary)',
          muted: 'var(--color-background-muted)',
          inset: 'var(--color-background-inset)',
        },
        brand: {
          DEFAULT: 'var(--color-brand-navy)',
          teal: 'var(--color-brand-teal)',
          'teal-light': 'var(--color-brand-teal-light)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-success': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        'gradient-info': 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
        'gradient-danger': 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
        'gradient-cool': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'gradient-warm': 'linear-gradient(135deg, #f5576c 0%, #f093fb 50%, #4facfe 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%)',
        'gradient-mint': 'linear-gradient(135deg, #0ef88b 0%, #04d8a6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        'gradient-light': 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      },
      animation: {
        // Existing
        'spin': 'spin 1s linear infinite',
        // Micro-interactions
        'button-glow': 'button-glow 2s ease-in-out infinite',
        'heart-beat': 'heart-beat 0.5s ease-in-out',
        'checkmark-draw': 'checkmark-draw 0.4s ease-out forwards',
        'ripple': 'ripple 0.6s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'fade-in-scale': 'fade-in-scale 0.3s ease-out',
        'count-up': 'count-up 0.3s ease-out',
        'progress-bar': 'progress-bar 1s ease-out',
        'cart-bounce': 'cart-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'button-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(14, 138, 110, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(14, 138, 110, 0.6)' },
        },
        'heart-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.2)' },
          '50%': { transform: 'scale(0.9)' },
          '75%': { transform: 'scale(1.1)' },
        },
        'checkmark-draw': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        'ripple': {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          'from': { transform: 'translateY(-20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in-scale': {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        'count-up': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'progress-bar': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'cart-bounce': {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.3)' },
          '50%': { transform: 'scale(0.9)' },
          '75%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(14, 138, 110, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 10px rgba(14, 138, 110, 0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

