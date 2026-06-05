import { Plus_Jakarta_Sans, Lora } from "next/font/google";
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
import LazyChatContainer from "@/components/chat/LazyChatContainer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ToastProvider from "@/components/ui/ToastProvider";
import ServiceWorkerRegistration from "@/components/ui/ServiceWorkerRegistration";
import { FlyToCartContainer } from "@/components/ui/FlyToCart";
import LoginPromptModal from "@/components/ui/LoginPromptModal";

export const dynamic = 'force-dynamic';

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600'],
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: 'swap',
});

const lora = Lora({
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  subsets: ["latin"],
  variable: "--font-lora",
  display: 'swap',
});

// Viewport configuration for mobile optimization
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#F6F9FC',
};

export const metadata = {
  metadataBase: new URL(SITE_CONFIG.url),

  title: {
    default:  SITE_CONFIG.fullName,
    template: '%s | MedCore BD',
  },
  description: SITE_CONFIG.description,
  keywords:    SITE_CONFIG.keywords,
  authors:     [{ name: 'MedCore Bangladesh Ltd.' }],
  creator:     'MedCore Bangladesh Ltd.',
  publisher:   'MedCore Bangladesh Ltd.',

  openGraph: {
    type:        'website',
    locale:      'en_BD',
    url:         SITE_CONFIG.url,
    siteName:    SITE_CONFIG.name,
    title:       SITE_CONFIG.fullName,
    description: SITE_CONFIG.description,
    images: [{
      url:    '/og-default.png',
      width:  1200,
      height: 630,
      alt:    'MedCore BD — Medical Equipment Supplier Bangladesh',
    }],
  },

  twitter: {
    card:        'summary_large_image',
    site:        SITE_CONFIG.twitterHandle,
    title:       SITE_CONFIG.fullName,
    description: SITE_CONFIG.description,
    images:      ['/og-default.png'],
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
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '',
    },
  },

  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'en-BD': SITE_CONFIG.url,
      'en':    SITE_CONFIG.url,
    },
  },
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className={`${plusJakarta.variable} ${lora.variable}`} data-scroll-behavior="smooth">
      <head>
        {/* Performance: preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Preload LCP hero image from Cloudinary CDN */}
        <link
          rel="preload"
          as="image"
          href="https://res.cloudinary.com/dm8eqxwlz/image/upload/f_auto,q_auto,w_1200,c_limit/medcorebd/hero-banner"
          fetchPriority="high"
        />
      </head>
      <body className="min-h-screen antialiased text-[var(--color-text-primary)]">
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
                    <main id="main-content">
                      <SiteChrome>{children}</SiteChrome>
                    </main>
                    <LazyChatContainer />
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

        {/* PWA Service Worker */}
        <ServiceWorkerRegistration />

        {/* Google Analytics 4 — loaded after interactive to avoid blocking */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
