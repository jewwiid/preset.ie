import { sentry } from './sentry';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private context: LogContext = {};

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = this.context.requestId ? `[${this.context.requestId}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level} ${contextStr} ${message}${dataStr}`;
  }

  private log(
    level: LogLevel,
    levelStr: string,
    message: string,
    data?: any
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(levelStr, message, data);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (data instanceof Error) {
          sentry.captureException(data, this.context);
        } else {
          sentry.captureMessage(message, 'error');
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        sentry.captureMessage(message, 'warning');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.TRACE:
        console.trace(formattedMessage);
        break;
    }

    // Add breadcrumb to Sentry
    sentry.addBreadcrumb({
      message,
      category: 'log',
      level: this.mapToSentryLevel(level),
      data: { ...this.context, ...data },
    });
  }

  private mapToSentryLevel(level: LogLevel): 'fatal' | 'error' | 'warning' | 'info' | 'debug' {
    switch (level) {
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.WARN:
        return 'warning';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        return 'debug';
      default:
        return 'info';
    }
  }

  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, error);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  trace(message: string, data?: any): void {
    this.log(LogLevel.TRACE, 'TRACE', message, data);
  }

  // Structured logging for specific events
  logEvent(event: {
    name: string;
    category: string;
    data?: Record<string, any>;
    level?: LogLevel;
  }): void {
    const level = event.level || LogLevel.INFO;
    this.log(
      level,
      this.mapToSentryLevel(level).toUpperCase(),
      `[${event.category}] ${event.name}`,
      event.data
    );
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: any): void {
    this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...metadata,
    });

    // Send to Sentry if duration exceeds threshold
    if (duration > 1000) {
      sentry.captureMessage(
        `Slow operation: ${operation} took ${duration}ms`,
        'warning'
      );
    }
  }

  // Request logging
  logRequest(req: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userId?: string;
  }): void {
    this.info(`${req.method} ${req.url} ${req.statusCode}`, {
      duration: `${req.duration}ms`,
      userId: req.userId,
    });
  }

  // Database query logging
  logQuery(query: {
    operation: string;
    table: string;
    duration: number;
    rowCount?: number;
  }): void {
    this.debug(`Database: ${query.operation} on ${query.table}`, {
      duration: `${query.duration}ms`,
      rowCount: query.rowCount,
    });
  }

  // Create a child logger with additional context
  child(context: LogContext): Logger {
    const childLogger = Object.create(this);
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();