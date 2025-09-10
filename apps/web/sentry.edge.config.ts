import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Edge Runtime specific configuration
  transportOptions: {
    // Increase timeout for edge runtime
    fetchOptions: {
      // timeout: 30000, // timeout is not supported in edge runtime
    },
  },
  
  beforeSend(event, hint) {
    // Add edge runtime context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'Edge Runtime',
        version: 'latest',
      },
    };
    
    // Filter sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    
    return event;
  },
});