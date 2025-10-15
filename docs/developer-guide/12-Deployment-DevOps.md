# Deployment & DevOps - Preset Platform

## 🚀 Deployment Strategy Overview

Preset implements a comprehensive deployment and DevOps strategy that ensures reliable, scalable, and maintainable infrastructure. The platform leverages modern cloud-native technologies and follows industry best practices for continuous deployment, monitoring, and infrastructure management.

## 🏗️ Infrastructure Architecture

### **Cloud Infrastructure**
- **Vercel**: Frontend hosting and serverless functions
- **Supabase**: Backend-as-a-Service (PostgreSQL, Auth, Storage, Realtime)
- **Stripe**: Payment processing and subscription management
- **Cloudflare**: CDN, DNS, and security services
- **PostHog**: Analytics and user behavior tracking
- **Sentry**: Error monitoring and performance tracking

### **Infrastructure Diagram**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │     Vercel      │    │    Supabase     │
│   CDN/DNS       │────│   Frontend      │────│   Backend       │
│   Security      │    │   Serverless    │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │     Stripe      │
                       │   Payments      │
                       └─────────────────┘
```

## 🔧 Deployment Pipeline

### **CI/CD Workflow**
Automated deployment pipeline with multiple stages.

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Run linting
        run: npm run lint
      
      - name: Type checking
        run: npm run check-types

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build applications
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: |
            apps/web/.next
            apps/mobile/dist
            packages/*/dist

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
      
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod=false'
      
      - name: Run database migrations
        run: |
          npx supabase db push --include-all
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod=true'
      
      - name: Run production database migrations
        run: |
          npx supabase db push --include-all
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'Production deployment successful!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### **Environment Management**
Multiple environments for different stages of development.

```typescript
// config/environments.ts
export const environments = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:3000',
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY_DEV,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY_TEST,
    posthogKey: process.env.POSTHOG_KEY_DEV,
    sentryDsn: process.env.SENTRY_DSN_DEV
  },
  
  staging: {
    name: 'Staging',
    apiUrl: 'https://staging.preset.ie',
    supabaseUrl: process.env.SUPABASE_URL_STAGING,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY_STAGING,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY_TEST,
    posthogKey: process.env.POSTHOG_KEY_STAGING,
    sentryDsn: process.env.SENTRY_DSN_STAGING
  },
  
  production: {
    name: 'Production',
    apiUrl: 'https://preset.ie',
    supabaseUrl: process.env.SUPABASE_URL_PROD,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY_PROD,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY_PROD,
    posthogKey: process.env.POSTHOG_KEY_PROD,
    sentryDsn: process.env.SENTRY_DSN_PROD
  }
};

export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV || 'development';
  return environments[env] || environments.development;
}
```

## 🗄️ Database Management

### **Migration Strategy**
Structured database migration management.

```sql
-- migrations/001_initial_schema.sql
-- Create initial tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_text TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  comp_type TEXT NOT NULL CHECK (comp_type IN ('paid', 'tfp', 'expenses')),
  comp_amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_gigs_owner ON gigs(owner_user_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_start_time ON gigs(start_time);
CREATE INDEX idx_gigs_location ON gigs(location_text);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view published gigs" ON gigs FOR SELECT USING (status = 'published');
CREATE POLICY "Users can manage own gigs" ON gigs FOR ALL USING (auth.uid() = owner_user_id);
```

### **Database Backup Strategy**
Automated backup and recovery procedures.

```bash
#!/bin/bash
# scripts/backup-database.sh

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="preset_backup_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/${BACKUP_FILE}.gz s3://preset-backups/database/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "preset_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### **Database Monitoring**
Real-time database performance monitoring.

```typescript
// monitoring/database-monitor.ts
import { createClient } from '@supabase/supabase-js';

export class DatabaseMonitor {
  private supabase: any;
  private metrics: Map<string, number> = new Map();
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  async monitorPerformance(): Promise<DatabaseMetrics> {
    const start = Date.now();
    
    // Test query performance
    const { data, error } = await this.supabase
      .from('gigs')
      .select('id, title, status')
      .limit(100);
    
    const queryTime = Date.now() - start;
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    // Check connection pool
    const poolStatus = await this.checkConnectionPool();
    
    // Check disk usage
    const diskUsage = await this.checkDiskUsage();
    
    return {
      queryTime,
      connectionPool: poolStatus,
      diskUsage,
      timestamp: new Date().toISOString()
    };
  }
  
  private async checkConnectionPool(): Promise<ConnectionPoolStatus> {
    // Implementation for checking connection pool status
    return {
      activeConnections: 10,
      maxConnections: 100,
      utilization: 0.1
    };
  }
  
  private async checkDiskUsage(): Promise<DiskUsage> {
    // Implementation for checking disk usage
    return {
      used: '2.5GB',
      total: '10GB',
      utilization: 0.25
    };
  }
}
```

## 📊 Monitoring & Observability

### **Application Monitoring**
Comprehensive monitoring setup with Sentry and PostHog.

```typescript
// monitoring/app-monitor.ts
import * as Sentry from '@sentry/nextjs';
import { PostHog } from 'posthog-node';

export class AppMonitor {
  private posthog: PostHog;
  
  constructor() {
    this.posthog = new PostHog(process.env.POSTHOG_KEY!, {
      host: 'https://app.posthog.com'
    });
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1
    });
  }
  
  trackError(error: Error, context?: any): void {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra
    });
    
    this.posthog.capture({
      distinctId: context?.userId || 'anonymous',
      event: 'error_occurred',
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        ...context
      }
    });
  }
  
  trackPerformance(metric: PerformanceMetric): void {
    this.posthog.capture({
      distinctId: metric.userId || 'anonymous',
      event: 'performance_metric',
      properties: {
        metric_name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp
      }
    });
  }
  
  trackUserAction(userId: string, action: string, properties?: any): void {
    this.posthog.capture({
      distinctId: userId,
      event: action,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

### **Health Checks**
Comprehensive health check endpoints.

```typescript
// api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {} as any
  };
  
  try {
    // Check database connection
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    health.services.database = {
      status: error ? 'unhealthy' : 'healthy',
      responseTime: Date.now() - Date.now(),
      error: error?.message
    };
    
    // Check Stripe connection
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const balance = await stripe.balance.retrieve();
    
    health.services.stripe = {
      status: 'healthy',
      balance: balance.available[0].amount
    };
    
    // Check external APIs
    const nanoBananaResponse = await fetch('https://api.nanobanana.com/health');
    health.services.nanoBanana = {
      status: nanoBananaResponse.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - Date.now()
    };
    
    // Overall health status
    const unhealthyServices = Object.values(health.services)
      .filter((service: any) => service.status === 'unhealthy');
    
    if (unhealthyServices.length > 0) {
      health.status = 'degraded';
    }
    
    res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(500).json(health);
  }
}
```

## 🔒 Security & Compliance

### **Security Headers**
Comprehensive security headers configuration.

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.stripe.com https://*.posthog.com https://*.sentry.io;"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

### **Environment Security**
Secure environment variable management.

```bash
# .env.example
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# AI Services
NANOBANANA_API_KEY=your_nanobanana_api_key
NANOBANANA_API_URL=https://api.nanobanana.com

# Analytics
POSTHOG_KEY=your_posthog_key
SENTRY_DSN=your_sentry_dsn

# Email
PLUNK_API_KEY=your_plunk_api_key
```

## 🚀 Performance Optimization

### **CDN Configuration**
Cloudflare CDN optimization.

```typescript
// vercel.json
{
  "functions": {
    "apps/web/pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
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
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### **Database Optimization**
Database performance tuning.

```sql
-- Database optimization queries
-- Create optimized indexes
CREATE INDEX CONCURRENTLY idx_gigs_status_start_time ON gigs(status, start_time);
CREATE INDEX CONCURRENTLY idx_applications_gig_status ON applications(gig_id, status);
CREATE INDEX CONCURRENTLY idx_showcases_created_at ON showcases(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM gigs 
WHERE status = 'published' 
AND start_time > NOW() 
ORDER BY created_at DESC 
LIMIT 20;

-- Update table statistics
ANALYZE gigs;
ANALYZE applications;
ANALYZE showcases;
```

## 📱 Mobile Deployment

### **Expo Build Configuration**
Mobile app build and deployment.

```json
// app.json
{
  "expo": {
    "name": "Preset",
    "slug": "preset-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "ie.preset.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "ie.preset.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### **EAS Build Configuration**
Expo Application Services build configuration.

```json
// eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 🔄 Rollback Strategy

### **Automated Rollback**
Quick rollback procedures for production issues.

```bash
#!/bin/bash
# scripts/rollback.sh

# Configuration
PREVIOUS_DEPLOYMENT_ID=$1
VERCEL_TOKEN=$VERCEL_TOKEN
VERCEL_ORG_ID=$VERCEL_ORG_ID
VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID

if [ -z "$PREVIOUS_DEPLOYMENT_ID" ]; then
  echo "Usage: ./rollback.sh <deployment_id>"
  exit 1
fi

echo "Rolling back to deployment: $PREVIOUS_DEPLOYMENT_ID"

# Rollback Vercel deployment
curl -X POST "https://api.vercel.com/v1/deployments/$PREVIOUS_DEPLOYMENT_ID/promote" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "production"
  }'

# Rollback database migrations if needed
if [ "$2" = "--with-db" ]; then
  echo "Rolling back database migrations..."
  npx supabase db reset --linked
fi

echo "Rollback completed successfully"
```

## 📈 Scaling Strategy

### **Horizontal Scaling**
Scaling strategies for increased load.

```typescript
// scaling/auto-scaling.ts
export class AutoScalingManager {
  private metrics: Map<string, number> = new Map();
  
  async checkScalingNeeds(): Promise<ScalingDecision> {
    const metrics = await this.collectMetrics();
    
    // Check CPU usage
    if (metrics.cpuUsage > 80) {
      return {
        action: 'scale_up',
        reason: 'High CPU usage',
        targetInstances: Math.ceil(metrics.currentInstances * 1.5)
      };
    }
    
    // Check memory usage
    if (metrics.memoryUsage > 85) {
      return {
        action: 'scale_up',
        reason: 'High memory usage',
        targetInstances: Math.ceil(metrics.currentInstances * 1.3)
      };
    }
    
    // Check response time
    if (metrics.averageResponseTime > 1000) {
      return {
        action: 'scale_up',
        reason: 'Slow response time',
        targetInstances: Math.ceil(metrics.currentInstances * 1.2)
      };
    }
    
    // Scale down if usage is low
    if (metrics.cpuUsage < 30 && metrics.memoryUsage < 40) {
      return {
        action: 'scale_down',
        reason: 'Low resource usage',
        targetInstances: Math.max(1, Math.floor(metrics.currentInstances * 0.8))
      };
    }
    
    return {
      action: 'no_change',
      reason: 'Metrics within normal range',
      targetInstances: metrics.currentInstances
    };
  }
  
  private async collectMetrics(): Promise<SystemMetrics> {
    // Implementation for collecting system metrics
    return {
      cpuUsage: 45,
      memoryUsage: 60,
      averageResponseTime: 250,
      currentInstances: 3
    };
  }
}
```

## 🎯 Deployment Checklist

### **Pre-Deployment Checklist**
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Backup procedures verified
- [ ] Rollback plan prepared

### **Post-Deployment Checklist**
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Performance metrics baseline
- [ ] User acceptance testing
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Incident response plan activated

---

This comprehensive deployment and DevOps strategy ensures Preset maintains high availability, performance, and security standards. The automated pipeline, monitoring, and scaling capabilities provide a robust foundation for the platform's growth and reliability.
