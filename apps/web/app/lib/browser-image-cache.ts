'use client';

export interface CacheConfig {
  maxSize: number; // in MB
  maxItems: number;
  defaultTTL: number; // in seconds
  strategy: 'aggressive' | 'moderate' | 'conservative';
}

export interface CachedImage {
  url: string;
  data: Blob;
  timestamp: number;
  ttl: number;
  size: number;
}

export class BrowserImageCache {
  private cache: Map<string, CachedImage> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50, // 50MB default
      maxItems: 100,
      defaultTTL: 3600, // 1 hour
      strategy: 'moderate',
      ...config
    };
  }

  async get(url: string): Promise<Blob | null> {
    const cached = this.cache.get(url);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(url);
      return null;
    }

    return cached.data;
  }

  async set(url: string, data: Blob, ttl?: number): Promise<void> {
    const cacheEntry: CachedImage = {
      url,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.getTTLForStrategy(),
      size: data.size
    };

    // Check cache size limits
    await this.enforceLimits();

    this.cache.set(url, cacheEntry);
  }

  async preload(urls: string[]): Promise<void> {
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          await this.set(url, blob);
        }
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      }
    });

    await Promise.all(promises);
  }

  private getTTLForStrategy(): number {
    switch (this.config.strategy) {
      case 'aggressive':
        return 86400; // 24 hours
      case 'conservative':
        return 1800; // 30 minutes
      case 'moderate':
      default:
        return 3600; // 1 hour
    }
  }

  private async enforceLimits(): Promise<void> {
    // Remove expired entries
    const now = Date.now();
    for (const [url, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(url);
      }
    }

    // Check item count limit
    if (this.cache.size >= this.config.maxItems) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries
      const toRemove = entries.slice(0, this.cache.size - this.config.maxItems + 1);
      toRemove.forEach(([url]) => this.cache.delete(url));
    }

    // Check size limit
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;

    if (totalSize > maxSizeBytes) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      let currentSize = totalSize;
      for (const [url, entry] of entries) {
        if (currentSize <= maxSizeBytes) break;
        
        this.cache.delete(url);
        currentSize -= entry.size;
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const now = Date.now();
    const expiredCount = entries.filter(entry => 
      now - entry.timestamp > entry.ttl * 1000
    ).length;

    return {
      itemCount: this.cache.size,
      totalSizeMB: totalSize / (1024 * 1024),
      expiredCount,
      maxSizeMB: this.config.maxSize,
      maxItems: this.config.maxItems,
      strategy: this.config.strategy
    };
  }
}

// Global cache instance
export const imageCache = new BrowserImageCache({
  maxSize: 100, // 100MB
  maxItems: 200,
  strategy: 'moderate'
});

// Utility functions
export async function getCachedImage(url: string): Promise<Blob | null> {
  return imageCache.get(url);
}

export async function cacheImage(url: string, data: Blob, ttl?: number): Promise<void> {
  return imageCache.set(url, data, ttl);
}

export async function preloadImages(urls: string[]): Promise<void> {
  return imageCache.preload(urls);
}

export function clearImageCache(): void {
  imageCache.clear();
}

export function getImageCacheStats() {
  return imageCache.getStats();
}