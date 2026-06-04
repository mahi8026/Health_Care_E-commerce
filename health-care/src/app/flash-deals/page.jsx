import { Suspense } from 'react';
import FlashDealsPageClient from './FlashDealsPageClient';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: '🔥 Flash Deals — Limited Time Offers | MedCore BD',
  description: 'Grab amazing deals on medical equipment, diagnostic tools, laboratory reagents, and hospital supplies. Limited stock, limited time — Bangladesh\'s best medical equipment deals.',
  keywords: 'flash deals Bangladesh, medical equipment deals, diagnostic equipment discount, laboratory reagents sale, hospital supplies offers, medical equipment Bangladesh discount',
  alternates: { canonical: `${SITE_CONFIG.url}/flash-deals` },
  openGraph: {
    title: '🔥 Flash Deals — Limited Time Offers | MedCore BD',
    description: 'Grab amazing deals on medical equipment. Limited stock, limited time!',
    url: `${SITE_CONFIG.url}/flash-deals`,
    images: [{ url: '/og-flash-deals.png', width: 1200, height: 630, alt: 'Flash Deals — MedCore BD' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '🔥 Flash Deals — Limited Time Offers | MedCore BD',
    description: 'Grab amazing deals on medical equipment. Limited stock, limited time!',
    images: ['/og-flash-deals.png'],
  },
};

/**
 * Flash Deals Page — Server Component wrapper
 */
export default function FlashDealsPage() {
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
          fontSize: 48,
          marginBottom: 16,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          🔥
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Loading Flash Deals...</div>
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
