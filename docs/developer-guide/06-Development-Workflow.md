# Development Workflow - Preset Platform

## 🚀 Getting Started

### **Prerequisites**
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 10.5.0+ (comes with Node.js)
- **Git**: For version control
- **Supabase Account**: Free tier works for development
- **Stripe Account**: For payment testing
- **NanoBanana Account**: For AI features

### **Quick Setup**
```bash
# Clone the repository
git clone https://github.com/preset/preset.ie.git
cd preset

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 🏗️ Project Structure

### **Monorepo Architecture**
```
preset/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── lib/              # Utilities and services
│   │   └── public/           # Static assets
│   ├── mobile/                # Expo React Native app
│   │   ├── app/              # Expo Router pages
│   │   ├── components/       # Shared components
│   │   └── lib/              # Mobile-specific utilities
│   └── edge/                 # Supabase Edge Functions
│       └── functions/        # Serverless functions
├── packages/
│   ├── domain/               # Pure domain logic (DDD)
│   │   ├── src/
│   │   │   ├── identity/     # User and profile domain
│   │   │   ├── gigs/         # Gig management domain
│   │   │   ├── applications/ # Application domain
│   │   │   ├── collaboration/ # Messaging domain
│   │   │   └── showcases/    # Showcase domain
│   │   └── package.json
│   ├── application/          # Use cases and ports
│   │   ├── src/
│   │   │   ├── identity/     # Identity use cases
│   │   │   ├── gigs/         # Gig use cases
│   │   │   └── ...
│   │   └── package.json
│   ├── adapters/             # Infrastructure adapters
│   │   ├── src/
│   │   │   ├── supabase/     # Supabase implementations
│   │   │   ├── stripe/       # Stripe implementations
│   │   │   └── external/     # External service adapters
│   │   └── package.json
│   ├── ui/                   # Shared UI components
│   │   ├── src/
│   │   │   ├── components/   # Reusable components
│   │   │   ├── hooks/        # Custom hooks
│   │   │   └── utils/        # UI utilities
│   │   └── package.json
│   ├── tokens/               # Design tokens
│   │   ├── src/
│   │   │   ├── colors.ts     # Color palette
│   │   │   ├── spacing.ts    # Spacing system
│   │   │   └── typography.ts # Typography scale
│   │   └── package.json
│   └── types/                # Shared TypeScript types
│       ├── src/
│       │   ├── api.ts        # API types
│       │   ├── domain.ts     # Domain types
│       │   └── ui.ts         # UI types
│       └── package.json
├── supabase/                 # Database and functions
│   ├── migrations/           # Database migrations
│   ├── functions/            # Edge functions
│   └── config.toml          # Supabase configuration
└── scripts/                  # Build and deployment scripts
    ├── build-deploy.sh      # Build and deploy script
    ├── monitor.sh           # Monitoring script
    └── test-*.js            # Test scripts
```

## 🔧 Development Environment

### **Environment Configuration**

#### **Required Environment Variables**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# AI Services
NANOBANANA_API_KEY=your_nanobanana_api_key
NANOBANANA_CREDIT_RATIO=4

# Email Services
PLUNK_API_KEY=your_plunk_api_key

# Admin Configuration
ADMIN_EMAIL=admin@preset.ie
ADMIN_PASSWORD=admin123456
```

#### **Development vs Production**
- **Development**: Uses local Supabase instance or development project
- **Production**: Uses production Supabase project with production keys
- **Testing**: Uses test Stripe keys and test NanoBanana credits
- **Staging**: Uses staging environment with production-like data

### **Database Setup**

#### **Local Development**
```bash
# Start Supabase locally
npx supabase start

# Run migrations
npx supabase db push

# Seed development data
npx supabase db seed
```

#### **Production Database**
```bash
# Apply migrations to production
npx supabase db push --include-all

# Verify database status
npx supabase db status
```

## 🛠️ Development Workflow

### **Daily Development Routine**

#### **Morning Setup**
```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Start development server
npm run dev

# Check for any linting issues
npm run lint
```

#### **Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
npm run dev

# Run tests
npm test

# Check types
npm run check-types

# Commit changes
git add .
git commit -m "feat: add new feature"
```

#### **End of Day**
```bash
# Push changes
git push origin feature/new-feature

# Create pull request
# Review code and merge
```

### **Code Quality Standards**

#### **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### **ESLint Configuration**
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "no-debugger": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

#### **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### **Testing Strategy**

#### **Unit Tests**
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### **Integration Tests**
```bash
# Run integration tests
npm run test:integration

# Test API endpoints
npm run test:api
```

#### **End-to-End Tests**
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headless mode
npm run test:e2e:headless
```

## 🚀 Build & Deployment

### **Build Process**

#### **Development Build**
```bash
# Build for development
npm run build

# Build with type checking
npm run build:check

# Build with linting
npm run build:lint
```

#### **Production Build**
```bash
# Build for production
npm run build:production

# Build with optimization
npm run build:optimized
```

### **Deployment Pipeline**

#### **Automated Deployment**
```bash
# Full build and deploy
./scripts/build-deploy.sh --all

# Deploy to staging
./scripts/build-deploy.sh --staging

# Deploy to production
./scripts/build-deploy.sh --production
```

#### **Manual Deployment**
```bash
# Build project
npm run build

# Deploy to Vercel
vercel --prod

# Deploy mobile app
expo publish
```

### **Environment Management**

#### **Environment Promotion**
1. **Development**: Local development with test data
2. **Staging**: Production-like environment for testing
3. **Production**: Live environment with real users

#### **Database Migrations**
```bash
# Create new migration
npx supabase migration new add_new_feature

# Apply migrations
npx supabase db push

# Rollback migration
npx supabase db rollback
```

## 🔍 Debugging & Troubleshooting

### **Common Issues**

#### **Build Errors**
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build

# Check for TypeScript errors
npm run check-types

# Check for linting errors
npm run lint
```

#### **Database Issues**
```bash
# Check database connection
npx supabase status

# Reset local database
npx supabase db reset

# Check migration status
npx supabase migration list
```

#### **Environment Issues**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Verify API keys
npm run test:env

# Check service status
npm run health-check
```

### **Debugging Tools**

#### **Development Tools**
- **React DevTools**: Browser extension for React debugging
- **Supabase Dashboard**: Database and API debugging
- **Stripe Dashboard**: Payment debugging
- **Vercel Dashboard**: Deployment and performance monitoring

#### **Logging**
```typescript
// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}

// Production logging
import { logger } from '@/lib/logger';
logger.info('User action', { userId, action });
```

## 📊 Performance Optimization

### **Frontend Performance**

#### **Code Splitting**
```typescript
// Lazy load components
const LazyComponent = lazy(() => import('./LazyComponent'));

// Route-based splitting
const HomePage = lazy(() => import('./pages/HomePage'));
```

#### **Image Optimization**
```typescript
// Next.js Image component
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### **Caching Strategy**
```typescript
// Service worker for caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// React Query for data caching
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['gigs'],
  queryFn: fetchGigs,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### **Backend Performance**

#### **Database Optimization**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_location ON gigs USING GIST(location);

-- Optimize queries
EXPLAIN ANALYZE SELECT * FROM gigs WHERE status = 'published';
```

#### **API Optimization**
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Response caching
app.use('/api/gigs', limiter, cache('5 minutes'));
```

## 🔒 Security Best Practices

### **Code Security**

#### **Input Validation**
```typescript
import { z } from 'zod';

const CreateGigSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    radius: z.number().min(1).max(50)
  })
});

// Validate input
const validatedData = CreateGigSchema.parse(inputData);
```

#### **SQL Injection Prevention**
```typescript
// Use parameterized queries
const { data } = await supabase
  .from('gigs')
  .select('*')
  .eq('status', 'published')
  .eq('owner_id', userId);
```

#### **XSS Prevention**
```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);
```

### **Environment Security**

#### **Secret Management**
```bash
# Use environment variables for secrets
export STRIPE_SECRET_KEY=sk_test_...

# Never commit secrets to git
echo "*.env" >> .gitignore
echo "*.env.local" >> .gitignore
```

#### **API Security**
```typescript
// Validate API keys
const validateApiKey = (key: string): boolean => {
  return key.startsWith('sk_') && key.length > 20;
};

// Rate limiting
const rateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

## 📈 Monitoring & Analytics

### **Performance Monitoring**

#### **Core Web Vitals**
```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

#### **Error Tracking**
```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### **Business Metrics**

#### **User Analytics**
```typescript
// PostHog integration
import { PostHog } from 'posthog-js';

PostHog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY);

// Track user events
PostHog.capture('gig_created', {
  userId: user.id,
  gigId: gig.id,
  category: gig.category
});
```

#### **Revenue Tracking**
```typescript
// Track subscription events
PostHog.capture('subscription_upgraded', {
  userId: user.id,
  fromTier: 'free',
  toTier: 'plus',
  revenue: 9.99
});
```

## 🎯 Development Best Practices

### **Code Organization**

#### **Domain-Driven Design**
- **Keep domain pure**: No framework dependencies in domain layer
- **Use cases**: Business logic in application layer
- **Adapters**: Infrastructure concerns in adapter layer
- **Events**: Use domain events for cross-context communication

#### **Component Structure**
```typescript
// Component organization
components/
├── ui/                 # Reusable UI components
├── forms/              # Form components
├── layout/             # Layout components
├── features/           # Feature-specific components
└── pages/              # Page components
```

### **Git Workflow**

#### **Branch Strategy**
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature development branches
- **hotfix/**: Critical bug fixes

#### **Commit Messages**
```bash
# Conventional commits
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: maintenance tasks
```

### **Code Review Process**

#### **Review Checklist**
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Performance implications considered
- [ ] Security implications reviewed
- [ ] Accessibility requirements met

#### **Review Guidelines**
- **Be constructive**: Focus on improvement, not criticism
- **Ask questions**: Clarify understanding before suggesting changes
- **Test thoroughly**: Verify changes work as expected
- **Document decisions**: Explain why certain approaches were chosen

---

This comprehensive development workflow ensures consistent, high-quality code while maintaining team productivity and code maintainability. The structured approach supports the platform's growth and scalability requirements.
