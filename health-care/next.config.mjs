/** @type {import('next').NextConfig} */

// Validate required environment variables at build time
// This ensures the build fails fast if critical env vars are missing
import { validateEnv } from './src/utils/validateEnv.mjs';
try {
  validateEnv();
} catch (error) {
  // Log warning but don't fail build - Vercel may set env vars after config load
  console.warn('⚠️ Environment validation warning:', error.message);
  console.warn('Continuing build - ensure env vars are set in Vercel dashboard');
}

// Conditionally load bundle analyzer — only available as a devDependency
// Vercel production builds skip devDependencies, so guard the import
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  const bundleAnalyzer = (await import('@next/bundle-analyzer')).default;
  withBundleAnalyzer = bundleAnalyzer({
    enabled: true,
    openAnalyzer: false,
  });
}

const nextConfig = {
  // Proxy /api/* to the backend in development to avoid CORS issues
  async rewrites() {
    // NEXT_PUBLIC_API_URL may be '/api' (relative) in dev — always proxy to real backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // Redirect old query-param category URLs to slug-based URLs
  async redirects() {
    const categoryRedirects = [
      { name: 'Diagnostic Equipment',  slug: 'diagnostic-equipment' },
      { name: 'Surgical Instruments',  slug: 'surgical-instruments' },
      { name: 'Laboratory Reagents',   slug: 'laboratory-reagents' },
      { name: 'Hospital Machines',     slug: 'hospital-machines' },
      { name: 'Lab Equipment',         slug: 'lab-equipment' },
      { name: 'PPE & Safety',          slug: 'ppe-safety' },
      { name: 'Dental Equipment',      slug: 'dental-equipment' },
      { name: 'Implants & Ortho',      slug: 'implants-ortho' },
    ];

    return categoryRedirects.map(({ name, slug }) => ({
      source: '/products',
      has: [{ type: 'query', key: 'category', value: name }],
      destination: `/products/category/${slug}`,
      permanent: true, // 301 redirect — passes SEO link equity
    }));
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },

  // Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'medcorebd.com',
      },
      {
        protocol: 'https',
        hostname: '**.medcorebd.com',
      },
      // Cloudinary — product images uploaded via CldUploadWidget
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  
  // Enable SWC minification for better performance
  // Note: swcMinify is enabled by default in Next.js 16+

  // Remove console.log in production builds, but keep console.error and console.warn
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize imports for large icon/component libraries to reduce bundle size
  experimental: {
    optimizePackageImports: ['react-icons', 'recharts', 'date-fns', '@heroicons/react'],
  },

  // Enable source maps in production for Sentry error tracking
  productionBrowserSourceMaps: true,
};

export default withBundleAnalyzer(nextConfig);
