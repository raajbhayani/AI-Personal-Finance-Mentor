import Head from 'next/head';
import { useRouter } from 'next/router';

export interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
  alternateLanguages?: Array<{ hrefLang: string; href: string }>;
  schema?: object;
}

const DEFAULT_SEO = {
  title: 'AI Personal Finance Mentor - Smart Financial Management',
  description: 'Take control of your finances with  insights, budgeting tools, and personalized financial advice. Track expenses, set goals, and achieve financial freedom.',
  keywords: [
    'personal finance',
    'budgeting',
    'financial planning',
    'expense tracking',
    'AI financial advisor',
    'money management',
    'financial goals',
    'investment tracking',
    'financial analytics',
  ],
  author: 'AI Personal Finance Mentor',
  siteName: 'AI Personal Finance Mentor',
  type: 'website' as const,
  locale: 'en_US',
  twitterCard: 'summary_large_image' as const,
  twitterSite: '@financeai',
};

export const MetaTags: React.FC<SEOMetaProps> = ({
  title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  author = DEFAULT_SEO.author,
  image,
  url,
  type = DEFAULT_SEO.type,
  publishedTime,
  modifiedTime,
  section,
  tags,
  locale = DEFAULT_SEO.locale,
  siteName = DEFAULT_SEO.siteName,
  twitterCard = DEFAULT_SEO.twitterCard,
  twitterSite = DEFAULT_SEO.twitterSite,
  twitterCreator,
  noIndex = false,
  noFollow = false,
  canonical,
  alternateLanguages = [],
  schema,
}) => {
  const router = useRouter();

  // Build full title
  const fullTitle = title
    ? `${title} | ${DEFAULT_SEO.title}`
    : DEFAULT_SEO.title;

  // Build canonical URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://financeapp.com';
  const currentUrl = url || `${baseUrl}${router.asPath}`;
  const canonicalUrl = canonical || currentUrl;

  // Build image URL
  const imageUrl = image
    ? image.startsWith('http')
      ? image
      : `${baseUrl}${image}`
    : `${baseUrl}/images/og-default.jpg`;

  // Build keywords string
  const keywordsString = keywords.join(', ');

  // Robots meta content
  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Alternate Languages */}
      {alternateLanguages.map((alt) => (
        <link
          key={alt.hrefLang}
          rel="alternate"
          hrefLang={alt.hrefLang}
          href={alt.href}
        />
      ))}

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={title || 'AI Personal Finance Mentor'} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Article specific Open Graph tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags && tags.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />

      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* Preconnect to External Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      )}
    </Head>
  );
};

// Pre-built SEO configurations for common pages
export const SEOConfigs = {
  home: {
    title: 'Home',
    description: 'Take control of your finances with  insights, budgeting tools, and personalized financial advice. Start your journey to financial freedom today.',
    keywords: ['personal finance app', 'AI financial advisor', 'budgeting tool', 'expense tracker'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'AI Personal Finance Mentor',
      description: ' personal finance management application',
      url: 'https://financeapp.com',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  },

  dashboard: {
    title: 'Dashboard',
    description: 'Your personal finance dashboard with real-time insights, spending analytics, and goal tracking.',
    noIndex: true, // Private page
  },

  transactions: {
    title: 'Transactions',
    description: 'Track and manage your financial transactions with smart categorization and detailed analytics.',
    noIndex: true,
  },

  goals: {
    title: 'Financial Goals',
    description: 'Set, track, and achieve your financial goals with  recommendations and progress monitoring.',
    noIndex: true,
  },

  analytics: {
    title: 'Financial Analytics',
    description: 'Deep insights into your spending patterns, trends, and financial health with advanced analytics.',
    noIndex: true,
  },

  blog: {
    title: 'Financial Tips & Insights',
    description: 'Expert financial advice, tips, and insights to help you make smarter money decisions.',
    type: 'website' as const,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'AI Personal Finance Mentor Blog',
      description: 'Financial tips and insights blog',
      url: 'https://financeapp.com/blog',
    },
  },

  about: {
    title: 'About Us',
    description: 'Learn about our mission to democratize financial literacy through  personal finance tools.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About AI Personal Finance Mentor',
      description: 'Learn about our mission and team',
      url: 'https://financeapp.com/about',
    },
  },

  privacy: {
    title: 'Privacy Policy',
    description: 'Our commitment to protecting your privacy and how we handle your financial data securely.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy',
      description: 'Privacy policy for AI Personal Finance Mentor',
      url: 'https://financeapp.com/privacy',
    },
  },

  terms: {
    title: 'Terms of Service',
    description: 'Terms and conditions for using the AI Personal Finance Mentor platform.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms of Service',
      description: 'Terms of service for AI Personal Finance Mentor',
      url: 'https://financeapp.com/terms',
    },
  },
};

// Hook for dynamic SEO based on data
export const useDynamicSEO = (data?: any) => {
  if (!data) return {};

  // Generate SEO based on content type
  if (data.type === 'article') {
    return {
      title: data.title,
      description: data.excerpt || data.description,
      type: 'article' as const,
      publishedTime: data.publishedAt,
      modifiedTime: data.updatedAt,
      image: data.image,
      tags: data.tags,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image,
        datePublished: data.publishedAt,
        dateModified: data.updatedAt,
        author: {
          '@type': 'Person',
          name: data.author?.name || 'AI Personal Finance Mentor',
        },
      },
    };
  }

  return {};
};

export default MetaTags;