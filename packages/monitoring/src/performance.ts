import { sentry } from './sentry';
import { logger } from './logger';
import { metrics } from './metrics';

export interface PerformanceMark {
  name: string;
  startTime: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, PerformanceMark> = new Map();
  private measures: PerformanceMeasure[] = [];

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  mark(name: string, metadata?: Record<string, any>): void {
    const mark: PerformanceMark = {
      name,
      startTime: Date.now(),
      metadata,
    };
    this.marks.set(name, mark);
  }

  measure(
    name: string,
    startMark: string,
    endMark?: string,
    metadata?: Record<string, any>
  ): PerformanceMeasure | null {
    const start = this.marks.get(startMark);
    if (!start) {
      logger.warn(`Performance mark '${startMark}' not found`);
      return null;
    }

    const endTime = endMark ? this.marks.get(endMark)?.startTime : Date.now();
    if (endTime === undefined) {
      logger.warn(`Performance mark '${endMark}' not found`);
      return null;
    }

    const measure: PerformanceMeasure = {
      name,
      duration: endTime - start.startTime,
      startTime: start.startTime,
      endTime,
      metadata: { ...start.metadata, ...metadata },
    };

    this.measures.push(measure);
    
    // Log and send metrics
    logger.logPerformance(name, measure.duration, measure.metadata);
    metrics.createHistogram(`performance.${name}`).observe(measure.duration);

    // Clean up marks
    this.marks.delete(startMark);
    if (endMark) {
      this.marks.delete(endMark);
    }

    return measure;
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    const transaction = sentry.startTransaction(name, 'function');

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      transaction.finish();
      logger.logPerformance(name, duration, metadata);
      metrics.createHistogram(`performance.${name}`).observe(duration);
      
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      transaction.finish();
      throw error;
    }
  }

  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = Date.now();

    try {
      const result = fn();
      const duration = Date.now() - startTime;
      
      logger.logPerformance(name, duration, metadata);
      metrics.createHistogram(`performance.${name}`).observe(duration);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  getMarks(): PerformanceMark[] {
    return Array.from(this.marks.values());
  }

  getMeasures(): PerformanceMeasure[] {
    return [...this.measures];
  }

  clearMarks(): void {
    this.marks.clear();
  }

  clearMeasures(): void {
    this.measures = [];
  }

  clear(): void {
    this.clearMarks();
    this.clearMeasures();
  }

  // Web Vitals tracking (for web apps)
  trackWebVitals(vitals: {
    FCP?: number; // First Contentful Paint
    LCP?: number; // Largest Contentful Paint
    FID?: number; // First Input Delay
    CLS?: number; // Cumulative Layout Shift
    TTFB?: number; // Time to First Byte
  }): void {
    Object.entries(vitals).forEach(([metric, value]) => {
      if (value !== undefined) {
        metrics.createHistogram(`webvitals.${metric.toLowerCase()}`).observe(value);
        
        // Alert on poor performance
        const thresholds: Record<string, number> = {
          FCP: 2500,
          LCP: 4000,
          FID: 300,
          CLS: 0.25,
          TTFB: 800,
        };

        if (thresholds[metric] && value > thresholds[metric]) {
          logger.warn(`Poor ${metric} performance: ${value}`, {
            threshold: thresholds[metric],
          });
        }
      }
    });
  }

  // Resource timing (for web apps)
  trackResourceTiming(resource: {
    name: string;
    type: string;
    duration: number;
    size?: number;
  }): void {
    metrics.createHistogram('resource.duration', { 
      type: resource.type 
    }).observe(resource.duration);

    if (resource.size) {
      metrics.createHistogram('resource.size', { 
        type: resource.type 
      }).observe(resource.size);
    }

    // Alert on slow resources
    if (resource.duration > 1000) {
      logger.warn(`Slow resource load: ${resource.name}`, {
        type: resource.type,
        duration: resource.duration,
        size: resource.size,
      });
    }
  }

  // Database query performance
  trackQuery(query: {
    operation: string;
    table: string;
    duration: number;
    rowCount?: number;
  }): void {
    metrics.recordDatabaseQuery(query.operation, query.table, query.duration);
    
    // Alert on slow queries
    if (query.duration > 100) {
      logger.warn(`Slow database query`, {
        operation: query.operation,
        table: query.table,
        duration: query.duration,
        rowCount: query.rowCount,
      });
    }
  }

  // API endpoint performance
  trackApiCall(api: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    userId?: string;
  }): void {
    metrics.recordApiCall(api.path, api.method, api.statusCode, api.duration);
    
    // Alert on slow API calls
    if (api.duration > 500) {
      logger.warn(`Slow API call`, api);
    }

    // Alert on errors
    if (api.statusCode >= 500) {
      logger.error(`API error`, api);
    }
  }

  // Generate performance report
  generateReport(): {
    marks: PerformanceMark[];
    measures: PerformanceMeasure[];
    summary: {
      totalMeasures: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
      p50: number;
      p95: number;
      p99: number;
    };
  } {
    const durations = this.measures.map(m => m.duration).sort((a, b) => a - b);
    const totalMeasures = durations.length;

    if (totalMeasures === 0) {
      return {
        marks: this.getMarks(),
        measures: this.getMeasures(),
        summary: {
          totalMeasures: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          p50: 0,
          p95: 0,
          p99: 0,
        },
      };
    }

    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * totalMeasures) - 1;
      return durations[Math.max(0, index)] || 0;
    };

    return {
      marks: this.getMarks(),
      measures: this.getMeasures(),
      summary: {
        totalMeasures,
        averageDuration: durations.reduce((a, b) => a + b, 0) / totalMeasures,
        minDuration: durations[0] || 0,
        maxDuration: durations[totalMeasures - 1] || 0,
        p50: getPercentile(50),
        p95: getPercentile(95),
        p99: getPercentile(99),
      },
    };
  }
}

// Export singleton instance
export const performance = PerformanceMonitor.getInstance();