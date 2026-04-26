import bundleAnalyzer from '@next/bundle-analyzer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin Turbopack's workspace root to this project directory,
  // preventing it from being confused by the parent folder's package.json
  turbopack: {
    root: __dirname,
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
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
};

export default withBundleAnalyzer(nextConfig);
