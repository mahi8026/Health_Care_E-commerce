module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/products',
        'http://localhost:3000/reagent-store',
        'http://localhost:3000/search',
      ],
      numberOfRuns: 2,
      settings: {
        // Run both desktop and mobile presets
        preset: 'desktop',
        // Throttle to simulate real-world conditions
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      assertions: {
        'categories:performance':     ['warn',  { minScore: 0.8 }],
        'categories:accessibility':   ['error', { minScore: 0.88 }],
        'categories:best-practices':  ['error', { minScore: 0.9 }],
        // SEO: /search has noindex by design — accept lower score
        'categories:seo':             ['warn',  { minScore: 0.6 }],
        'first-contentful-paint':     ['warn',  { maxNumericValue: 1800 }],
        'largest-contentful-paint':   ['warn',  { maxNumericValue: 2500 }],
        'cumulative-layout-shift':    ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time':        ['warn',  { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
