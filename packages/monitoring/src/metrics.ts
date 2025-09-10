import { sentry } from './sentry';

export interface Metric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface Counter {
  increment(value?: number): void;
  decrement(value?: number): void;
  getValue(): number;
  reset(): void;
}

export interface Gauge {
  set(value: number): void;
  getValue(): number;
}

export interface Histogram {
  observe(value: number): void;
  getPercentile(percentile: number): number;
  getMean(): number;
  getMin(): number;
  getMax(): number;
  getCount(): number;
  reset(): void;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private metricsBuffer: Metric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  initialize(flushIntervalMs: number = 60000): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(() => {
      this.flush();
    }, flushIntervalMs) as NodeJS.Timeout;
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }

  createCounter(name: string, tags?: Record<string, string>): Counter {
    const key = this.getMetricKey(name, tags);
    
    if (!this.counters.has(key)) {
      const counter = new CounterImpl(name, tags);
      this.counters.set(key, counter);
    }
    
    return this.counters.get(key)!;
  }

  createGauge(name: string, tags?: Record<string, string>): Gauge {
    const key = this.getMetricKey(name, tags);
    
    if (!this.gauges.has(key)) {
      const gauge = new GaugeImpl(name, tags);
      this.gauges.set(key, gauge);
    }
    
    return this.gauges.get(key)!;
  }

  createHistogram(name: string, tags?: Record<string, string>): Histogram {
    const key = this.getMetricKey(name, tags);
    
    if (!this.histograms.has(key)) {
      const histogram = new HistogramImpl(name, tags);
      this.histograms.set(key, histogram);
    }
    
    return this.histograms.get(key)!;
  }

  recordMetric(metric: Metric): void {
    this.metricsBuffer.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });

    // Auto-flush if buffer is getting large
    if (this.metricsBuffer.length >= 100) {
      this.flush();
    }
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}:${tagStr}`;
  }

  private flush(): void {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    // Send metrics to monitoring service
    // In production, this would send to DataDog, CloudWatch, etc.
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Log metrics summary
    const summary = this.summarizeMetrics(metrics);
    sentry.addBreadcrumb({
      message: 'Metrics flushed',
      category: 'metrics',
      level: 'info',
      data: summary,
    });

    console.debug('Metrics flushed:', summary);
  }

  private summarizeMetrics(metrics: Metric[]): Record<string, any> {
    const summary: Record<string, any> = {
      count: metrics.length,
      metrics: {},
    };

    metrics.forEach(metric => {
      if (!summary.metrics[metric.name]) {
        summary.metrics[metric.name] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
        };
      }

      const stat = summary.metrics[metric.name];
      stat.count++;
      stat.sum += metric.value;
      stat.min = Math.min(stat.min, metric.value);
      stat.max = Math.max(stat.max, metric.value);
    });

    return summary;
  }

  // Business metrics helpers
  recordApiCall(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.createCounter('api.calls', { endpoint, method, status: String(statusCode) }).increment();
    this.createHistogram('api.duration', { endpoint, method }).observe(duration);
  }

  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    this.createCounter('db.queries', { operation, table }).increment();
    this.createHistogram('db.duration', { operation, table }).observe(duration);
  }

  recordCacheHit(cache: string, hit: boolean): void {
    this.createCounter('cache.requests', { cache, result: hit ? 'hit' : 'miss' }).increment();
  }

  recordBusinessEvent(event: string, value: number = 1, metadata?: Record<string, string>): void {
    this.createCounter(`business.${event}`, metadata).increment(value);
  }
}

class CounterImpl implements Counter {
  private value: number = 0;

  constructor(
    private name: string,
    private tags?: Record<string, string>
  ) {}

  increment(value: number = 1): void {
    this.value += value;
    metrics.recordMetric({
      name: this.name,
      value: this.value,
      tags: this.tags,
    });
  }

  decrement(value: number = 1): void {
    this.increment(-value);
  }

  getValue(): number {
    return this.value;
  }

  reset(): void {
    this.value = 0;
  }
}

class GaugeImpl implements Gauge {
  private value: number = 0;

  constructor(
    private name: string,
    private tags?: Record<string, string>
  ) {}

  set(value: number): void {
    this.value = value;
    metrics.recordMetric({
      name: this.name,
      value: this.value,
      tags: this.tags,
    });
  }

  getValue(): number {
    return this.value;
  }
}

class HistogramImpl implements Histogram {
  private values: number[] = [];

  constructor(
    private name: string,
    private tags?: Record<string, string>
  ) {}

  observe(value: number): void {
    this.values.push(value);
    metrics.recordMetric({
      name: this.name,
      value,
      tags: this.tags,
    });
  }

  getPercentile(percentile: number): number {
    if (this.values.length === 0) return 0;
    
    const sorted = [...this.values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  getMean(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  getMin(): number {
    if (this.values.length === 0) return 0;
    return Math.min(...this.values);
  }

  getMax(): number {
    if (this.values.length === 0) return 0;
    return Math.max(...this.values);
  }

  getCount(): number {
    return this.values.length;
  }

  reset(): void {
    this.values = [];
  }
}

// Export singleton instance
export const metrics = MetricsCollector.getInstance();