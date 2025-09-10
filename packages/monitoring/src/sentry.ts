import * as Sentry from '@sentry/node';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
}

export class SentryMonitoring {
  private static instance: SentryMonitoring;
  private initialized = false;

  private constructor() {}

  static getInstance(): SentryMonitoring {
    if (!SentryMonitoring.instance) {
      SentryMonitoring.instance = new SentryMonitoring();
    }
    return SentryMonitoring.instance;
  }

  initialize(config: SentryConfig): void {
    if (this.initialized) {
      console.warn('Sentry already initialized');
      return;
    }

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      sampleRate: config.sampleRate || 1.0,
      tracesSampleRate: config.tracesSampleRate || 0.1,
      profilesSampleRate: config.profilesSampleRate || 0.1,
      debug: config.debug || false,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.ContextLines(),
      ],
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          if (event.request.cookies) {
            delete event.request.cookies;
          }
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
        }

        // Don't send events in development unless explicitly enabled
        if (config.environment === 'development' && !config.debug) {
          return null;
        }

        return event;
      },
      beforeSendTransaction(transaction) {
        // Filter out health check endpoints
        if (transaction.transaction === 'GET /health') {
          return null;
        }
        return transaction;
      },
    });

    this.initialized = true;
  }

  captureException(error: Error, context?: Record<string, any>): void {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    Sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; username?: string } | null): void {
    Sentry.setUser(user);
  }

  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  setContext(key: string, context: Record<string, any>): void {
    Sentry.setContext(key, context);
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }): void {
    Sentry.addBreadcrumb(breadcrumb);
  }

  startTransaction(
    name: string,
    op: string
  ): Sentry.Transaction {
    return Sentry.startTransaction({ name, op });
  }

  async flush(timeout?: number): Promise<boolean> {
    return Sentry.flush(timeout || 2000);
  }

  close(timeout?: number): Promise<boolean> {
    return Sentry.close(timeout || 2000);
  }

  // Utility method for wrapping async functions with error handling
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: string
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.captureException(error as Error, { 
          function: fn.name, 
          context,
          args: JSON.stringify(args) 
        });
        throw error;
      }
    }) as T;
  }

  // Performance monitoring helpers
  measurePerformance<T>(
    operation: string,
    fn: () => T | Promise<T>
  ): T | Promise<T> {
    const transaction = this.startTransaction(operation, 'function');
    const span = transaction.startChild({
      op: 'function',
      description: operation,
    });

    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          span.finish();
          transaction.finish();
        });
      } else {
        span.finish();
        transaction.finish();
        return result;
      }
    } catch (error) {
      span.setStatus('internal_error');
      span.finish();
      transaction.finish();
      throw error;
    }
  }
}

// Export singleton instance
export const sentry = SentryMonitoring.getInstance();

// Export Sentry types for convenience
export type { SeverityLevel, Transaction, Span } from '@sentry/node';