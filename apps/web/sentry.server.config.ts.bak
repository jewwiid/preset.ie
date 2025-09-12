import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Profiling
  profilesSampleRate: 0.1,
  
  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],
  
  // Filter out health check endpoints
  beforeSendTransaction(transaction) {
    // Don't send transactions for health checks
    if (
      transaction.transaction === 'GET /api/health' ||
      transaction.transaction === 'HEAD /'
    ) {
      return null;
    }
    return transaction;
  },
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      // Remove auth headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-supabase-auth'];
      }
      // Remove sensitive data from body
      if (event.request.data) {
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey'];
        sensitiveKeys.forEach(key => {
          if (event.request?.data?.[key]) {
            event.request.data[key] = '***';
          }
        });
      }
    }
    
    // Add additional context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'Node.js',
        version: process.version,
      },
    };
    
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }
    
    return event;
  },
});