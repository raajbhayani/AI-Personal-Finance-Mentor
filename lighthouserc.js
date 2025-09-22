module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/transactions',
        'http://localhost:3000/goals',
        'http://localhost:3000/analytics',
      ],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],

        // Performance metrics
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',

        // Best Practices
        'uses-https': 'error',
        'is-on-https': 'off', // Disabled for local testing
        'no-vulnerable-libraries': 'warn',
        'csp-xss': 'warn',

        // SEO
        'document-title': 'error',
        'meta-description': 'error',
        'robots-txt': 'off', // Disabled for local testing
        'canonical': 'warn',

        // Progressive Web App
        'installable-manifest': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        'content-width': 'error',

        // Custom thresholds for specific metrics
        'unused-css-rules': ['warn', { maxLength: 2 }],
        'unused-javascript': ['warn', { maxLength: 2 }],
        'modern-image-formats': 'warn',
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'efficient-animated-content': 'warn',
        'uses-responsive-images': 'warn',
        'preload-lcp-image': 'warn',
        'uses-rel-preload': 'warn',
        'uses-rel-preconnect': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: './lighthouse-results',
    },
  },
};