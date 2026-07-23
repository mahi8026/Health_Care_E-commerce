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
        'brand-teal': '#0e8a6e',
        'brand-teal-light': '#4ddbb8',
        
        // Page backgrounds
        'page': 'var(--color-background-page)',
        'page-top': 'var(--color-background-page-top)',
        'surface': 'var(--color-background-primary)',
        'surface-subtle': 'var(--color-background-secondary)',
        'surface-muted': 'var(--color-background-muted)',
        'surface-inset': 'var(--color-background-inset)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
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
        'dropdown': '700',
        'modal': '800',
        'header': '900',
        'bottom-nav': '1000',
      },
    },
  },
  plugins: [],
};
