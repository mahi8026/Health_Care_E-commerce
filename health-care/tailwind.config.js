/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
}

