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
        'brand-navy': '#001D5D',
        'brand-navy-deep': '#002B78',
        'brand-teal': '#18AFA9',
        'brand-teal-light': '#00D0CA',
        'brand-teal-dark': '#007F7B',
        'brand-orange': '#FF6B00',
        'brand-teal-tint': '#E4F8F7',
        'brand-teal-icon': '#008F8A',
        
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
        'success': '#16A085',
        'danger': '#DC3545',
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

        // ── Third-party service colors (external brand palettes — never
        //    re-themed to the Mediport brand) ──────────────────────────────
        'bkash': 'var(--color-bkash)',
        'bkash-dark': 'var(--color-bkash-dark)',
        'nagad': 'var(--color-nagad)',
        'nagad-dark': 'var(--color-nagad-dark)',
        'whatsapp': 'var(--color-whatsapp)',
        'whatsapp-dark': 'var(--color-whatsapp-dark)',
        'whatsapp-deep': 'var(--color-whatsapp-deep)',
        'whatsapp-tint': 'var(--color-whatsapp-tint)',
        'whatsapp-tint-soft': 'var(--color-whatsapp-tint-soft)',
        'whatsapp-ink': 'var(--color-whatsapp-ink)',

        // ── Role / plan accents ───────────────────────────────────────────
        'role-admin': 'var(--color-role-admin)',
        'role-admin-strong': 'var(--color-role-admin-strong)',
        'role-admin-deep': 'var(--color-role-admin-deep)',
        'role-admin-mid': 'var(--color-role-admin-mid)',
        'role-admin-hover': 'var(--color-role-admin-hover)',
        'role-admin-tint': 'var(--color-role-admin-tint)',
        'role-admin-tint-soft': 'var(--color-role-admin-tint-soft)',
        'role-admin-tint-mid': 'var(--color-role-admin-tint-mid)',
        'role-admin-border': 'var(--color-role-admin-border)',
        'role-admin-border-soft': 'var(--color-role-admin-border-soft)',
        'role-admin-ink': 'var(--color-role-admin-ink)',

        // ── Deep navy chrome ─────────────────────────────────────────────
        'surface-deep': 'var(--color-surface-deep)',
        'surface-deep-alt': 'var(--color-surface-deep-alt)',

        // ── Accents ──────────────────────────────────────────────────────
        'gold': 'var(--color-gold)',
        'amber': 'var(--color-amber)',
        'amber-bright': 'var(--color-amber-bright)',

        // ── Success / warning / danger / blue scales ─────────────────────
        'success-bright': 'var(--color-success-bright)',
        'success-light': 'var(--color-success-light)',
        'success-mid': 'var(--color-success-mid)',
        'success-tint-strong': 'var(--color-success-tint)',
        'success-deep': 'var(--color-success-deep)',
        'warning-deep': 'var(--color-warning-deep)',
        'warning-strong': 'var(--color-warning-strong)',
        'warning-mid': 'var(--color-warning-mid)',
        'warning-tint-strong': 'var(--color-warning-tint)',
        'warning-tint-soft': 'var(--color-warning-tint-soft)',
        'warning-bright': 'var(--color-warning-bright)',
        'danger-strong': 'var(--color-danger-strong)',
        'danger-hover': 'var(--color-danger-hover)',
        'danger-tint-soft': 'var(--color-danger-tint-soft)',
        'blue-strong': 'var(--color-blue-strong)',
        'blue-deep': 'var(--color-blue-deep)',
        'brand-teal-wash': 'var(--color-brand-teal-wash)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      screens: {
        'xs': '480px',
      },
      fontSize: {
        // Fluid scale tokens. Line-heights must be declared alongside each size:
        // overriding a fontSize entry with a bare string drops the paired
        // line-height, and every text-* utility then inherited line-height 1.5
        // from preflight — headings rendered ~25% looser than designed
        // (text-3xl at 45px leading instead of 36px) on every device.
        // Ratios below mirror Tailwind's own defaults.
        'xs': ['var(--text-xs)', { lineHeight: '1.35' }],
        'sm': ['var(--text-sm)', { lineHeight: '1.43' }],
        'base': ['var(--text-base)', { lineHeight: '1.5' }],
        'lg': ['var(--text-lg)', { lineHeight: '1.55' }],
        'xl': ['var(--text-xl)', { lineHeight: '1.4' }],
        '2xl': ['var(--text-2xl)', { lineHeight: '1.33' }],
        '3xl': ['var(--text-3xl)', { lineHeight: '1.2' }],
        '4xl': ['var(--text-4xl)', { lineHeight: '1.11' }],
        '5xl': ['var(--text-5xl)', { lineHeight: '1' }],
      },
      zIndex: {
        'sticky': '500',
        'dropdown': '700',
        // Aligned with --z-modal (globals.css) = 1200: modals, dialogs and
        // filter drawers must layer ABOVE the fixed header (900) and
        // bottom-nav (1000) — at 800 they rendered underneath both.
        'modal': '1200',
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
