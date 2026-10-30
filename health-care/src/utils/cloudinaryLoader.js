// health-care/src/utils/cloudinaryLoader.js
//
// Custom next/image loader — the single reason `images.unoptimized: true` could
// finally be removed (next.config.mjs).
//
// Why this exists:
//   `unoptimized: true` made Next emit ONE fixed `src` and silently ignore every
//   `sizes` prop, so a 1200 px Cloudinary hero was served to a 390 px phone
//   (Lighthouse: "Improve image delivery, 673 KiB"). A custom loader makes Next
//   build a real responsive `srcset` again — while still bypassing Next's own
//   /_next/image optimiser, which previously blew its Vercel quota (402
//   OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED).
//
// Contract: Next calls this per candidate width and expects a URL string back.
// It must stay a pure, edge-safe function (no Node APIs, no state).

import { optimizeCloudinaryUrl } from './cloudinary';

export default function cloudinaryLoader({ src, width }) {
  if (typeof src !== 'string' || !src) return src;

  // Only Cloudinary URLs are ours to transform. Everything else must pass
  // through untouched: local /public assets (/placeholder.png, logos, icons),
  // data:/blob: previews, and third-party hosts (Unsplash hero fallbacks,
  // YouTube thumbnails).
  if (!src.includes('res.cloudinary.com')) return src;

  // `quality` is deliberately ignored: Cloudinary's q_auto beats a fixed number
  // and is what the rest of the site already uses via optimizeCloudinaryUrl.
  // That helper also strips any pre-existing transform segment, so URLs that
  // were already sized (hero w_1200, product cards w_400) are re-sized to the
  // width Next is asking for instead of being double-transformed.
  return optimizeCloudinaryUrl(src, { width });
}
