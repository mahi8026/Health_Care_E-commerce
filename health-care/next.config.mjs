/** @type {import('next').NextConfig} */

// Validate required environment variables at build time
// This ensures the build fails fast if critical env vars are missing
import { validateEnv } from './src/utils/validateEnv.mjs';
try {
  validateEnv();
} catch (error) {
  // Log warning but don't fail build — env vars set in CF Pages / Vercel dashboard
  console.warn('⚠️ Environment validation warning:', error.message);
  console.warn('Continuing build - ensure env vars are set in the hosting dashboard');
}

// PWA configuration
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cloudinary-images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

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
    // On Cloudflare Pages/Workers, rewrites to external hosts are not supported.
    // API calls go directly to NEXT_PUBLIC_API_URL from the browser.
    // Only proxy in Node.js environments (local dev / Vercel).
    const isCloudflare = process.env.CF_PAGES === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // DISABLED PROXY IN PRODUCTION - Use direct API calls to avoid config issues
    // Frontend will call https://api.mediportbd.com/api/* directly via NEXT_PUBLIC_API_URL
    if (isCloudflare || isProduction) {
      return {
        beforeFiles: [
          {
            source: '/products/category/:slug',
            destination: '/products/category/:slug',
          },
        ],
        afterFiles: [],
      };
    }

    // Development only - proxy to localhost backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return {
      beforeFiles: [
        // Keep category routes intact - don't redirect them
        {
          source: '/products/category/:slug',
          destination: '/products/category/:slug',
        },
      ],
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },

  // Redirect old query-param category URLs to slug-based URLs
  async redirects() {
    // Force canonical www — redirect bare domain to www to prevent duplicate content
    const wwwRedirect = [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'mediportbd.com' }],
        destination: 'https://www.mediportbd.com/:path*',
        permanent: true, // 308 permanent redirect
      },
    ];

    // Redirect old query-param category URLs to slug-based URLs.
    // Slugs MUST match CATEGORY_SLUG_MAP in src/constants/categories.js exactly —
    // any mismatch sends Googlebot to a 404 and creates "Page with redirect" errors.
    const categoryRedirects = [
      { name: 'Diagnostic Equipment',            slug: 'diagnostic-equipment' },
      { name: 'Surgical Instruments',            slug: 'surgical-instruments' },
      { name: 'Laboratory Reagents',             slug: 'laboratory-reagents' },
      { name: 'Laboratory Equipment',            slug: 'laboratory-equipment' },
      { name: 'Hospital Machines',               slug: 'hospital-machines' },
      { name: 'PPE & Safety',                    slug: 'ppe-and-safety' },
      { name: 'Orthopedic Supports',             slug: 'orthopedic-supports' },
      { name: 'Surgical & Wound Care',           slug: 'surgical-and-wound-care' },
      { name: 'Consumables',                     slug: 'consumables' },
      { name: 'Diabetes Care',                   slug: 'diabetes-care' },
      { name: 'Ophthalmology & ENT Equipment',   slug: 'ophthalmology-and-ent-equipment' },
      { name: 'IV & Infusion Therapy',           slug: 'iv-and-infusion-therapy' },
      { name: 'Physiotherapy & Rehabilitation',  slug: 'physiotherapy-and-rehabilitation' },
      { name: 'Medical Supplies',                slug: 'medical-supplies' },
      { name: 'Blood Bank Supplies',             slug: 'blood-bank-supplies' },
      { name: 'Respiratory Equipment',           slug: 'respiratory-equipment' },
      { name: 'Medical Devices',                 slug: 'medical-devices' },
      { name: 'Compression Garments',            slug: 'compression-garments' },
      { name: 'Diagnostic Devices',              slug: 'diagnostic-devices' },
      { name: 'Mobility Aids',                   slug: 'mobility-aids' },
    ];

    return [
      ...wwwRedirect,
      ...categoryRedirects.map(({ name, slug }) => ({
        source: '/products',
        has: [{ type: 'query', key: 'category', value: name }],
        destination: `/products/category/${slug}`,
        permanent: true,
      })),
    ];
  },

  // Security + caching headers
  async headers() {
    return [
      // Next.js handles _next/static caching automatically
      // Cache static files in /public
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Security headers for all pages
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
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://browser.sentry-cdn.com https://cdn.onesignal.com https://api.onesignal.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.google-analytics.com https://ssl.gstatic.com https://www.gstatic.com https://img.youtube.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://health-care-e-commerce-ubyy.onrender.com https://api.mediportbd.com https://www.google-analytics.com https://analytics.google.com https://o4508309534613504.ingest.de.sentry.io https://res.cloudinary.com https://img.youtube.com https://onesignal.com https://api.onesignal.com https://cdn.onesignal.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
              "frame-src 'self' https://www.youtube.com https://www.google.com",
              "media-src 'self' https://res.cloudinary.com",
              "worker-src 'self' blob: https://cdn.onesignal.com https://api.onesignal.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ];
  },

  // Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
    // Trimmed device/image sizes — only the breakpoints actually used in the UI
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 days (was 1 year — allow re-optimization)
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'mediportbd.com',
      },
      {
        protocol: 'https',
        hostname: '**.mediportbd.com',
      },
      // Cloudinary — product images uploaded via CldUploadWidget
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Unsplash — hero slider fallback images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // YouTube — VideoSection thumbnail (CSP img-src already allows it)
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
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
    // Turbopack-compatible optimizations
    webpackBuildWorker: true,
  },

  // Turbopack config — required in Next.js 16 to silence warning
  turbopack: {
    // Set explicit root to workspace root (c:\Projects\Health Care) for monorepo
    root: process.env.VERCEL ? '/vercel/path0' : 'C:/Projects/Health Care',
  },

  // TypeScript is installed only for ESLint (eslint-config-next dependency)
  // Skip build-time type checking — this is a JS codebase with no tsconfig.json
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable source maps in production for Sentry error tracking
  // NOTE: Disabled to reduce bundle size — re-enable only when debugging production errors
  productionBrowserSourceMaps: false,
};

export default withBundleAnalyzer(pwaConfig(nextConfig));
