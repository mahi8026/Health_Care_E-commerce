/**
 * SEO Configuration for MedCore BD
 *
 * Central configuration for site metadata, organization schema,
 * and per-page metadata used across all 11 pages.
 */

// ---------------------------------------------------------------------------
// Site-wide configuration
// ---------------------------------------------------------------------------

export const siteConfig = {
  name: 'MedCore BD',
  description:
    'Your complete source for medical excellence. Surgical instruments, diagnostic machines, reagents, and lab equipment.',
  url: 'https://medcorebd.com',
  ogImage: '/og-default.png',
  locale: 'en_US',
  twitter: {
    card: 'summary_large_image',
    site: '@medcorebd',
  },
}

// ---------------------------------------------------------------------------
// Organization schema (Schema.org Organization)
// ---------------------------------------------------------------------------

export const organization = {
  name: 'MedCore BD',
  url: 'https://medcorebd.com',
  logo: 'https://medcorebd.com/logo.png',
  contactPoint: {
    telephone: '+880-XXX-XXXXXX',
    contactType: 'customer service',
    areaServed: 'BD',
    availableLanguage: ['en', 'bn'],
  },
  sameAs: [
    'https://facebook.com/medcorebd',
    'https://linkedin.com/company/medcorebd',
  ],
}

// ---------------------------------------------------------------------------
// Per-page metadata for all 11 pages
// ---------------------------------------------------------------------------

export const pageMetadata = {
  // 1. Home
  home: {
    title: 'MedCore BD - Medical Equipment & Supplies',
    description:
      'Your complete source for medical excellence. Surgical instruments, diagnostic machines, reagents, and lab equipment.',
    path: '/',
  },

  // 2. Search — noindex to prevent indexing of search result pages
  search: {
    title: 'Search Products | MedCore BD',
    description:
      'Search our comprehensive catalog of medical equipment, surgical instruments, diagnostic machines, and laboratory supplies.',
    path: '/search',
    noindex: true,
  },

  // 3. Reagent Store
  reagentStore: {
    title: 'Reagent Store | MedCore BD',
    description:
      'Browse our extensive collection of laboratory reagents, chemicals, and testing supplies for medical and research applications.',
    path: '/reagent-store',
  },

  // 4. Cart — noindex
  cart: {
    title: 'Shopping Cart | MedCore BD',
    description:
      'Review your selected medical equipment and supplies before checkout.',
    path: '/cart',
    noindex: true,
  },

  // 5. Checkout — noindex
  checkout: {
    title: 'Checkout | MedCore BD',
    description: 'Complete your purchase of medical equipment and supplies.',
    path: '/checkout',
    noindex: true,
  },

  // 6. Login — noindex
  login: {
    title: 'Login | MedCore BD',
    description:
      'Sign in to your MedCore BD account to access your orders and manage your profile.',
    path: '/login',
    noindex: true,
  },

  // 7. Register — noindex
  register: {
    title: 'Register | MedCore BD',
    description:
      'Create a MedCore BD account to start ordering medical equipment and supplies.',
    path: '/register',
    noindex: true,
  },

  // 8. Mobile App
  mobileApp: {
    title: 'Mobile App | MedCore BD',
    description:
      'Download the MedCore BD mobile app for convenient access to medical equipment and supplies on the go.',
    path: '/mobile-app',
  },

  // 9. Admin Dashboard — noindex + nofollow (authenticated-only page)
  admin: {
    title: 'Admin Dashboard | MedCore BD',
    description: 'MedCore BD administrative dashboard.',
    path: '/admin',
    noindex: true,
    nofollow: true,
  },

  // 10. B2B Dashboard — noindex + nofollow (authenticated-only page)
  b2b: {
    title: 'B2B Dashboard | MedCore BD',
    description: 'MedCore BD B2B buyer dashboard.',
    path: '/b2b',
    noindex: true,
    nofollow: true,
  },

  // 11. Product Detail — dynamic metadata generated per product via generateProductMetadata()
  product: {
    title: 'Product | MedCore BD',
    description:
      'View detailed information, pricing, and availability for medical equipment and supplies on MedCore BD.',
    path: '/products/[id]',
  },
}
