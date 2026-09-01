import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import FlashDealsPageClient from './FlashDealsPageClient';
import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';

// Pre-check for active deals server-side.
// If none exist, return a real 404 instead of rendering an empty client page
// (soft 404) which wastes crawl budget and confuses Google.
async function hasActiveDeals() {
  try {
    const res = await fetch(`${API}/flash-deals/active`, {
      next: { revalidate: 300 }, // 5 min — deals change; ISR clears when they go live
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!(data.success && data.data?.flashDeals?.length > 0);
  } catch {
    return false;
  }
}

export const metadata = {
  title: '🔥 Flash Deals — Limited Time Offers',
  description: 'Grab amazing deals on medical equipment, diagnostic tools, laboratory reagents, and hospital supplies. Limited stock, limited time — Bangladesh\'s best medical equipment deals.',
  keywords: 'flash deals Bangladesh, medical equipment deals, diagnostic equipment discount, laboratory reagents sale, hospital supplies offers, medical equipment Bangladesh discount',
  alternates: { canonical: `${SITE_CONFIG.url}/flash-deals` },
  openGraph: {
    title: '🔥 Flash Deals — Limited Time Offers',
    description: 'Grab amazing deals on medical equipment. Limited stock, limited time!',
    url: `${SITE_CONFIG.url}/flash-deals`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630, alt: 'Flash Deals — MediportBD' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '🔥 Flash Deals — Limited Time Offers',
    description: 'Grab amazing deals on medical equipment. Limited stock, limited time!',
    images: [`${SITE_CONFIG.url}/og-default.png`],
  },
};

/**
 * Flash Deals Page — Server Component wrapper
 */
export default async function FlashDealsPage() {
  const active = await hasActiveDeals();

  // No active deals → proper 404 so Google doesn't index an empty shell.
  // When deals go live, the 5-min ISR revalidation clears this automatically.
  if (!active) notFound();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <FlashDealsPageClient />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{
          fontSize: 'var(--text-5xl)',
          marginBottom: 16,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          🔥
        </div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Loading Flash Deals...</div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
