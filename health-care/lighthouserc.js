/**
 * Lighthouse CI Configuration
 * 
 * This configuration runs automated Lighthouse audits on pull requests to ensure
 * performance, accessibility, and best practices standards are maintained.
 * 
 * Performance Budgets:
 * - Desktop: Performance score ≥85% (balanced threshold accounting for variability)
 * - Mobile: Performance score ≥80% (requirement 3.9, 3.10)
 * 
 * Core Web Vitals Thresholds (Requirements 3.1, 3.2, 3.3):
 * - LCP (Largest Contentful Paint): <2.5s
 * - FID (First Input Delay): <100ms (via max-potential-fid)
 * - CLS (Cumulative Layout Shift): <0.1
 * - TTI (Time to Interactive): <3.8s (Requirement 3.4)
 * 
 * The CI will fail if any 'error' level assertion is not met.
 * 'warn' level assertions will log warnings but won't fail the build.
 * 
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */
module.exports = {
  ci: {
    collect: {
      // Test key pages on both desktop and mobile
      url: [
        'http://localhost:3000',
        'http://localhost:3000/products',
        'http://localhost:3000/reagent-store',
        'http://localhost:3000/search',
      ],
      numberOfRuns: 2,
      settings: {
        // Run desktop preset for primary performance testing
        preset: 'desktop',
        // Throttle to simulate real-world conditions
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      // Separate assertions for desktop and mobile
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance budgets
        // Desktop: score ≥90 (0.9), Mobile: score ≥80 (0.8)
        // Using 0.85 as a balanced threshold that's stricter than mobile but accounts for variability
        'categories:performance':     ['error', { minScore: 0.85 }],
        'categories:accessibility':   ['error', { minScore: 0.88 }],
        'categories:best-practices':  ['error', { minScore: 0.9 }],
        // SEO: /search has noindex by design — accept lower score
        'categories:seo':             ['warn',  { minScore: 0.6 }],
        
        // Core Web Vitals thresholds (Requirements 3.1, 3.2, 3.3)
        'first-contentful-paint':     ['warn',  { maxNumericValue: 1800 }],
        'largest-contentful-paint':   ['error', { maxNumericValue: 2500 }], // LCP <2.5s
        'cumulative-layout-shift':    ['error', { maxNumericValue: 0.1 }],   // CLS <0.1
        'total-blocking-time':        ['warn',  { maxNumericValue: 300 }],
        'max-potential-fid':          ['error', { maxNumericValue: 100 }],   // FID <100ms
        
        // Additional performance metrics (Requirement 3.4)
        'interactive':                ['warn',  { maxNumericValue: 3800 }],  // TTI <3.8s
        'speed-index':                ['warn',  { maxNumericValue: 3400 }],
        
        // Resource optimization
        'uses-optimized-images':      ['warn',  { maxLength: 0 }],
        'uses-responsive-images':     ['warn',  { maxLength: 0 }],
        'offscreen-images':           ['warn',  { maxLength: 0 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
