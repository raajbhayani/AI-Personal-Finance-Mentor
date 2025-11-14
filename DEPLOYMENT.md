# AI Personal Finance Mentor - Deployment Guide

This guide covers the complete deployment process for the AI Personal Finance Mentor application on Vercel.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Environments](#deployment-environments)
- [Deployment Process](#deployment-process)
- [Domain Configuration](#domain-configuration)
- [Environment Variables](#environment-variables)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Analytics](#monitoring--analytics)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## 🔧 Prerequisites

### Required Tools
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Git** (latest stable version)
- **Vercel CLI** (latest version)

### Installation
```bash
# Install Vercel CLI globally
npm install -g vercel

# Verify installation
vercel --version
```

### Account Setup
1. Create a [Vercel account](https://vercel.com/signup)
2. Connect your GitHub repository
3. Install the Vercel GitHub app

## 🌍 Environment Setup

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd ai-personal-finance-mentor

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure local environment variables
# See Environment Variables section below
```

### Environment Validation
```bash
# Validate environment configuration
npm run env:validate

# This checks:
# - Required variables are set
# - Security patterns are followed
# - Environment-specific requirements
```

## 🚀 Deployment Environments

### 1. Development
- **Purpose**: Local development
- **URL**: http://localhost:3000
- **Database**: Local MongoDB
- **Features**: All features enabled, debug mode on

### 2. Preview (Pull Requests)
- **Purpose**: Feature testing and review
- **URL**: Auto-generated preview URLs
- **Database**: Staging database
- **Features**: Production-like environment

### 3. Staging
- **Purpose**: Pre-production testing
- **URL**: https://staging.financeai.com
- **Database**: Staging database
- **Features**: Production features with test data

### 4. Production
- **Purpose**: Live application
- **URL**: https://financeai.com
- **Database**: Production database
- **Features**: All production features

## 📦 Deployment Process

### Quick Deployment

#### Using Scripts
```bash
# Deploy to preview
npm run deploy:preview

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy

# Custom deployment with options
node scripts/deploy.js production --skip-tests --verbose
```

#### Using Vercel CLI
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Staging deployment
vercel --target staging
```

### Step-by-Step Process

#### 1. Pre-deployment Checks
```bash
# Run all validation checks
npm run validate

# This includes:
# - TypeScript type checking
# - ESLint code quality checks
# - Prettier formatting checks
```

#### 2. Testing
```bash
# Run complete test suite
npm run test:ci

# Individual test types
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
```

#### 3. Build Optimization
```bash
# Production build
npm run build:prod

# Build with bundle analysis
npm run build:analyze

# Staging build
npm run build:staging
```

#### 4. Deployment
```bash
# Automated deployment (recommended)
npm run deploy

# Manual deployment
vercel --prod --confirm
```

#### 5. Post-deployment Verification
```bash
# Performance analysis
npm run performance:analyze

# Security audit
npm run security:audit

# Lighthouse audit
npm run performance:lighthouse https://financeai.com
```

## 🌐 Domain Configuration

### Primary Domains
- **Production**: `financeai.com`
- **Staging**: `staging.financeai.com`
- **API**: `api.financeai.com`
- **CDN**: `cdn.financeai.com`

### DNS Configuration
```
# A Records
financeai.com               -> 76.76.19.19
www.financeai.com          -> CNAME to financeai.com
staging.financeai.com      -> CNAME to vercel-dns.com
api.financeai.com          -> CNAME to vercel-dns.com

# SSL Certificates
- Wildcard certificate for *.financeai.com
- Individual certificates for alternative domains
```

### Vercel Domain Setup
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add custom domain: `financeai.com`
3. Configure DNS records as provided
4. Enable SSL certificate
5. Set up redirects for alternative domains

## 🔐 Environment Variables

### Required Variables by Environment

#### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/ai-finance-mentor
JWT_SECRET=your-development-jwt-secret
NEXTAUTH_SECRET=your-development-nextauth-secret
AI_API_KEY=your-ai-api-key
```

#### Staging
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_SITE_URL=https://staging.financeai.com
MONGODB_URI=mongodb+srv://staging-user:password@staging-cluster
JWT_SECRET=your-staging-jwt-secret
NEXTAUTH_SECRET=your-staging-nextauth-secret
REDIS_URL=redis://staging-redis:6379
SENDGRID_API_KEY=your-sendgrid-api-key
```

#### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SITE_URL=https://financeai.com
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster
JWT_SECRET=your-production-jwt-secret
NEXTAUTH_SECRET=your-production-nextauth-secret
REDIS_URL=rediss://prod-redis:6380
SENDGRID_API_KEY=your-sendgrid-api-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key
SENTRY_DSN=your-sentry-dsn
```

### Setting Environment Variables in Vercel

#### Via Dashboard
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable with appropriate environment scope
3. Set sensitive variables to "Encrypted"

#### Via CLI
```bash
# Set production variable
vercel env add MONGODB_URI production

# Set staging variable
vercel env add MONGODB_URI preview

# Set for all environments
vercel env add NEXT_PUBLIC_API_URL
```

#### Environment Variable Security
- ✅ Use strong, randomly generated secrets
- ✅ Different secrets for each environment
- ✅ Enable encryption for sensitive values
- ✅ Rotate secrets regularly
- ❌ Never commit secrets to version control
- ❌ Don't reuse development secrets in production

## ⚡ Performance Optimization

### Build Optimization
```bash
# Enable production optimizations
NODE_ENV=production npm run build

# Bundle analysis
ANALYZE=true npm run build

# Performance audit
npm run performance:analyze
```

### Caching Strategy
- **Static Assets**: 1 year cache with immutable flag
- **API Responses**: No cache for dynamic data
- **Images**: 24 hours cache with CDN
- **Fonts**: 30 days cache

### Image Optimization
```javascript
// Next.js Image component with optimization
<Image
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Code Splitting
- Automatic route-based splitting
- Component-level lazy loading
- Dynamic imports for heavy libraries

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Vercel Analytics**: Built-in performance metrics
- **Web Vitals**: Core performance indicators
- **Custom Performance API**: Application-specific metrics

### Error Tracking
```bash
# Sentry configuration
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-organization
SENTRY_PROJECT=ai-finance-mentor
```

### Analytics Setup
```bash
# Google Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Vercel Analytics
VERCEL_ANALYTICS_ID=your-analytics-id
```

### Health Checks
```bash
# Health check endpoint
curl https://financeai.com/api/health

# Response format
{
  "status": "ok",
  "timestamp": "2023-12-01T12:00:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs <deployment-url>

# Local build debugging
npm run build:prod 2>&1 | tee build.log

# Common solutions
npm run clean        # Clear build cache
npm run clean:all    # Full clean install
```

#### Environment Variable Issues
```bash
# Validate environment
npm run env:validate

# Check Vercel environment variables
vercel env ls

# Pull environment from Vercel
vercel env pull .env.local
```

#### Database Connection Issues
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));
"
```

#### Performance Issues
```bash
# Analyze bundle size
npm run performance:analyze

# Check for large dependencies
npm ls --depth=0 --long

# Lighthouse audit
npm run performance:lighthouse
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Vercel debug deployment
vercel --debug
```

### Support Resources
- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **GitHub Issues**: Project repository issues
- **Discord Community**: Vercel Discord server

## 🔒 Security Considerations

### Security Headers
Configured in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://api.financeai.com;
```

### Security Checklist
- ✅ HTTPS enforced for all environments
- ✅ Security headers configured
- ✅ Environment variables encrypted
- ✅ Dependencies regularly updated
- ✅ Security audit in CI/CD pipeline
- ✅ Rate limiting implemented
- ✅ Input validation and sanitization

### Security Auditing
```bash
# npm security audit
npm audit

# Custom security check
npm run security:audit

# Dependency vulnerability check
npm audit --audit-level moderate
```

## 📚 Additional Resources

### Scripts Reference
```bash
# Deployment
npm run deploy              # Production deployment
npm run deploy:staging      # Staging deployment
npm run deploy:preview      # Preview deployment

# Validation
npm run env:validate        # Environment validation
npm run validate           # Full validation suite

# Performance
npm run performance:analyze # Bundle analysis
npm run performance:lighthouse # Lighthouse audit

# Database
npm run db:migrate         # Database migrations
npm run db:seed           # Seed test data
npm run db:reset          # Reset database

# Maintenance
npm run clean             # Clean build cache
npm run security:audit    # Security audit
```

### Configuration Files
- `vercel.json` - Vercel deployment configuration
- `.env.example` - Environment variables template
- `.env.production` - Production environment template
- `.env.staging` - Staging environment template
- `next.config.js` - Next.js configuration
- `domains.txt` - Domain configuration reference

### Monitoring Dashboards
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Analytics**: https://vercel.com/analytics
- **Functions**: https://vercel.com/functions
- **Domains**: https://vercel.com/domains

---

## 🚀 Quick Start Checklist

For first-time deployment:

1. ✅ Install Vercel CLI: `npm install -g vercel`
2. ✅ Configure environment variables
3. ✅ Run validation: `npm run env:validate`
4. ✅ Run tests: `npm run test:ci`
5. ✅ Link project: `vercel link`
6. ✅ Deploy: `npm run deploy`
7. ✅ Configure custom domain
8. ✅ Set up monitoring
9. ✅ Verify deployment: `curl https://financeai.com/api/health`
10. ✅ Document deployment details

For ongoing deployments, use the automated scripts:
```bash
npm run deploy              # Full production deployment
node scripts/deploy.js production --verbose
```

---

**Need Help?**
- 📖 Check this documentation first
- 🐛 Search existing GitHub issues
- 💬 Ask in the project Discord/Slack
- 📧 Contact the development team

Happy deploying! 🎉