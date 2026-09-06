import { Plus_Jakarta_Sans, Lora, Noto_Sans_Bengali } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CompareProvider } from "@/context/CompareContext";
import { SITE_CONFIG } from "@/config/seo";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import StructuredData, {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/utils/structuredData";
import Script from "next/script";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
  import ToastProvider from "@/components/ui/ToastProvider";
  import ConfirmDialogProvider from "@/components/ui/ConfirmDialog";
import ServiceWorkerRegistration from "@/components/ui/ServiceWorkerRegistration";
import { FlyToCartContainer } from "@/components/ui/FlyToCart";
import LoginPromptModal from "@/components/ui/LoginPromptModal";
import InstallPWA from "@/components/ui/InstallPWA";
import BraveBrowserWarning from "@/components/ui/BraveBrowserWarning";
import MetaPixel from "@/components/tracking/MetaPixel";
import ExitIntentPopup from "@/components/marketing/ExitIntentPopup";

// NOTE: No `dynamic = 'force-dynamic'` here — the root layout must stay
// static so pages can be statically rendered / ISR-cached. Pages that need
// per-request freshness (cart, checkout, admin, b2b, login, quotes) opt in
// individually.

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600'],
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
});

const lora = Lora({
  weight: ['500', '600'],
  subsets: ["latin"],
  variable: "--font-lora",
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const notoBengali = Noto_Sans_Bengali({
  weight: ['400', '500', '600'],
  subsets: ["bengali"],
  variable: "--font-noto-bengali",
  display: 'swap',
  // Only used when html.lang-bn is active (Bengali UI toggle) — skip the
  // 105KB preload on English pages; the font loads on demand when needed.
  preload: false,
});

// Viewport configuration for mobile optimization
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff', // --color-background-page
};

export const metadata = {
  metadataBase: new URL(SITE_CONFIG.url),

  title: {
    default:  SITE_CONFIG.fullName,
    template: '%s | MediportBD',
  },
  description: SITE_CONFIG.description,
  keywords:    SITE_CONFIG.keywords,
  authors:     [{ name: 'Mediport Bangladesh Ltd.' }],
  creator:     'Mediport Bangladesh Ltd.',
  publisher:   'Mediport Bangladesh Ltd.',

  openGraph: {
    type:        'website',
    locale:      'en_BD',
    url:         SITE_CONFIG.url,
    siteName:    SITE_CONFIG.name,
    title:       SITE_CONFIG.fullName,
    description: SITE_CONFIG.description,
    images: [{
      url:    `${SITE_CONFIG.url}/og?title=Medical+Equipment+Supplier+Bangladesh&subtitle=Diagnostic+%E2%80%A2+Surgical+%E2%80%A2+Reagents+%E2%80%A2+Hospital+Equipment&page=MediportBD`,
      width:  1200,
      height: 630,
      alt:    'MediportBD — Medical Equipment Supplier Bangladesh',
    }],
  },

  twitter: {
    card:        'summary_large_image',
    site:        SITE_CONFIG.twitterHandle,
    title:       SITE_CONFIG.fullName,
    description: SITE_CONFIG.description,
    images:      [`${SITE_CONFIG.url}/og?title=Medical+Equipment+Supplier+Bangladesh&subtitle=Diagnostic+%E2%80%A2+Surgical+%E2%80%A2+Reagents+%E2%80%A2+Hospital+Equipment&page=MediportBD`],
  },

  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    other: {
      'msvalidate.01': 'FA60F2BF960A88AD83A0FBF06AE4101E',
    },
  },

  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'en-BD': SITE_CONFIG.url,
      'en':    SITE_CONFIG.url,
    },
  },

  icons: {
    icon: [
      { url: '/Mediport_Logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/Mediport_Logo.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
    ],
    shortcut: '/Mediport_Logo.png',
    apple: { url: '/Mediport_Logo.png', sizes: '180x180', type: 'image/png' },
    other: [
      { rel: 'icon', url: '/Mediport_Logo.png' },
      { rel: 'apple-touch-icon', url: '/Mediport_Logo.png' },
    ],
  },
};

export default function RootLayout({ children }) {
    // F10 — accept BOTH env spellings; .env.production defines the GA4 variant
  // and the old name is kept for local/legacy overrides.
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  // Meta/Facebook Pixel ID (configured in Vercel + env files).
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en" className={`${plusJakarta.variable} ${lora.variable} ${notoBengali.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Performance: preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />

        {/* Google Preferred Sources SDK — official two-line implementation
            (developers.google.com/search/docs/appearance/preferred-sources).
            Async: loads after HTML parse without blocking rendering. */}
        <script async src="https://news.google.com/swg/js/v1/publisher.js" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icons for iOS */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-128x128.png" />
        
        {/* iOS Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MediportBD" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-72x72.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        
        {/* MS Tiles for Windows */}
        <meta name="msapplication-TileColor" content="var(--color-brand-navy)" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

      </head>
      <body className={`min-h-screen antialiased text-[var(--color-text-primary)]`}>
        {/* Skip to main content — keyboard/screen-reader accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        {/* Site-wide structured data */}
        <StructuredData schema={generateOrganizationSchema()} />
        <StructuredData schema={generateWebSiteSchema()} />
        <LocalBusinessSchema />

        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <ErrorBoundary
                    title="Something went wrong"
                    message="An unexpected error occurred. Please refresh the page or contact support if the problem persists."
                  >
                    <div>
                      <SiteChrome>{children}</SiteChrome>
                    </div>
                  </ErrorBoundary>
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>

            </AuthProvider>
        </LanguageProvider>

        {/* Fly-to-cart animation container */}
        <FlyToCartContainer />

        {/* Login prompt modal for guest users */}
        <LoginPromptModal />

        {/* Toast Notifications - Global */}
        <ToastProvider />

        {/* Confirm Dialog - Global */}
        <ConfirmDialogProvider />

        {/* PWA Service Worker */}
        <ServiceWorkerRegistration />

        {/* PWA Install Prompt */}
        <InstallPWA />

        {/* Brave Browser Warning */}
        <BraveBrowserWarning />

        {/* Exit-intent first-order offer — once per visitor, skips purchase pages */}
        <ExitIntentPopup />

        {/* Google Analytics 4 — deferred to lazyOnload for better performance */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}

        {/* Meta / Facebook Pixel — conversion tracking for paid ads.
            SSR-safe, no-op without NEXT_PUBLIC_META_PIXEL_ID. Fires PageView on
            every client-side route change. */}
        <MetaPixel />

        {/* Meta Pixel noscript fallback (part of the official Meta snippet) —
            fires the tracking pixel for visitors with JavaScript disabled. */}
        {metaPixelId && (
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" alt="" />`,
            }}
          />
        )}

        {/* Accessibility fixes for third-party widgets */}
        <Script id="a11y-fixes" strategy="afterInteractive">
          {`
            (function() {
              var pending = false;
              function fixThirdPartyA11y() {
                pending = false;
                try {
                  // Only Google widgets (recaptcha, translate) carry these
                  // markers — avoid a full-document scan on every mutation.
                  var nodes = document.querySelectorAll('.wuMMb, [jscontroller]');
                  for (var i = 0; i < nodes.length; i++) {
                    var el = nodes[i];
                    var focusable = el.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
                    for (var j = 0; j < focusable.length; j++) {
                      var f = focusable[j];
                      f.setAttribute('tabindex', '-1');
                      f.setAttribute('aria-hidden', 'true');
                    }
                    if ('inert' in el) el.inert = true;
                  }
                } catch(e) {}
              }
              fixThirdPartyA11y();
              // rAF-coalesced observer: at most one scan per frame, only
              // triggered when nodes are actually added to the DOM.
              new MutationObserver(function(mutations) {
                if (pending) return;
                var interesting = false;
                for (var i = 0; i < mutations.length; i++) {
                  if (mutations[i].addedNodes && mutations[i].addedNodes.length) { interesting = true; break; }
                }
                if (!interesting) return;
                pending = true;
                requestAnimationFrame(fixThirdPartyA11y);
              }).observe(document.body, { childList: true, subtree: true });
              setTimeout(function() { fixThirdPartyA11y(); }, 1000);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
