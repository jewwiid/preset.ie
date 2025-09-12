/**
 * Performance optimization utilities for real-time messaging
 * Includes debouncing, throttling, batching, caching, and error handling
 */

import { useCallback, useRef, useState, useEffect } from 'react'

// Debounce utility for typing indicators and frequent updates
export function useDebounce<T extends any[]>(
  callback: (...args: T) => void | Promise<void>,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay) as unknown as NodeJS.Timeout
  }, [callback, delay])
}

// Throttle utility for scroll events and high-frequency updates
export function useThrottle<T extends any[]>(
  callback: (...args: T) => void | Promise<void>,
  delay: number
): (...args: T) => void {
  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  return useCallback((...args: T) => {
    const now = Date.now()
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now
      callback(...args)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now()
        callback(...args)
      }, delay - (now - lastCallRef.current)) as unknown as NodeJS.Timeout
    }
  }, [callback, delay])
}

// Message batching for efficient updates
export interface MessageBatch<T> {
  items: T[]
  timestamp: number
  id: string
}

export class MessageBatcher<T> {
  private items: T[] = []
  private timeout: NodeJS.Timeout | null = null
  private batchId = 0

  constructor(
    private onBatch: (batch: MessageBatch<T>) => void,
    private batchSize = 10,
    private maxWaitTime = 500 // ms
  ) {}

  add(item: T): void {
    this.items.push(item)
    
    // Flush if batch size reached
    if (this.items.length >= this.batchSize) {
      this.flush()
      return
    }
    
    // Schedule flush if not already scheduled
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush()
      }, this.maxWaitTime) as unknown as NodeJS.Timeout
    }
  }

  flush(): void {
    if (this.items.length === 0) return
    
    const batch: MessageBatch<T> = {
      items: [...this.items],
      timestamp: Date.now(),
      id: `batch_${++this.batchId}`
    }
    
    this.items = []
    
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    
    this.onBatch(batch)
  }

  clear(): void {
    this.items = []
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }
}

// LRU Cache for message and conversation data
export class LRUCache<K, V> {
  private cache = new Map<K, V>()
  
  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

// Rate limiter for API calls
export class RateLimiter {
  private requests: number[] = []
  
  constructor(
    private maxRequests: number,
    private timeWindow: number // ms
  ) {}

  canMakeRequest(): boolean {
    const now = Date.now()
    const windowStart = now - this.timeWindow
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart)
    
    return this.requests.length < this.maxRequests
  }

  recordRequest(): boolean {
    if (!this.canMakeRequest()) {
      return false
    }
    
    this.requests.push(Date.now())
    return true
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0
    
    const oldestRequest = Math.min(...this.requests)
    const resetTime = oldestRequest + this.timeWindow
    
    return Math.max(0, resetTime - Date.now())
  }
}

// Enhanced error handling with retry logic
export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number // ms
  maxDelay?: number // ms
  exponentialBackoff?: boolean
  shouldRetry?: (error: any, attempt: number) => boolean
}

export class RetryHandler {
  constructor(private options: RetryOptions = {}) {
    this.options = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBackoff: true,
      shouldRetry: (error) => !error?.permanent,
      ...options
    }
  }

  async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= this.options.maxAttempts!; attempt++) {
      try {
        const result = await operation()
        
        if (attempt > 1) {
          console.log(`${context || 'Operation'} succeeded on attempt ${attempt}`)
        }
        
        return result
      } catch (error: any) {
        lastError = error
        
        console.warn(
          `${context || 'Operation'} failed on attempt ${attempt}:`,
          error.message
        )
        
        // Check if we should retry
        if (
          attempt === this.options.maxAttempts ||
          !this.options.shouldRetry!(error, attempt)
        ) {
          break
        }
        
        // Calculate delay
        let delay = this.options.baseDelay!
        if (this.options.exponentialBackoff) {
          delay = Math.min(
            this.options.baseDelay! * Math.pow(2, attempt - 1),
            this.options.maxDelay!
          )
        }
        
        // Add jitter to prevent thundering herd
        delay = delay + Math.random() * (delay * 0.1)
        
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }
}

// React hook for performance monitoring
export interface PerformanceMetrics {
  componentRenderTime: number
  lastRenderTimestamp: number
  totalRenders: number
  averageRenderTime: number
}

export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    componentRenderTime: 0,
    lastRenderTimestamp: 0,
    totalRenders: 0,
    averageRenderTime: 0
  })
  
  const renderStartRef = useRef<number>(0)
  
  useEffect(() => {
    renderStartRef.current = performance.now()
  })
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current
    const timestamp = Date.now()
    
    setMetrics(prev => {
      const totalRenders = prev.totalRenders + 1
      const averageRenderTime = (prev.averageRenderTime * prev.totalRenders + renderTime) / totalRenders
      
      return {
        componentRenderTime: renderTime,
        lastRenderTimestamp: timestamp,
        totalRenders,
        averageRenderTime
      }
    })
    
    // Log slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(
        `${componentName} render took ${renderTime.toFixed(2)}ms (slow render detected)`
      )
    }
  })
  
  return metrics
}

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager
  private caches = new Map<string, LRUCache<any, any>>()
  private cleanupInterval: NodeJS.Timeout | null = null
  
  private constructor() {
    // Start periodic cleanup
    this.startCleanup()
  }
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }
  
  getCache<K, V>(name: string, maxSize = 100): LRUCache<K, V> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new LRUCache(maxSize))
    }
    return this.caches.get(name)!
  }
  
  clearCache(name: string): void {
    const cache = this.caches.get(name)
    if (cache) {
      cache.clear()
    }
  }
  
  clearAllCaches(): void {
    this.caches.forEach(cache => cache.clear())
  }
  
  getMemoryUsage(): { caches: Record<string, number> } {
    const caches: Record<string, number> = {}
    this.caches.forEach((cache, name) => {
      caches[name] = cache.size
    })
    return { caches }
  }
  
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // Periodic cleanup logic could go here
      // For now, just log memory usage
      console.debug('Memory usage:', this.getMemoryUsage())
    }, 60000) as unknown as NodeJS.Timeout // Every minute
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clearAllCaches()
  }
}

// Error boundary utility for messaging components
export interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
  eventType?: string
  timestamp: number
}

export class MessageErrorHandler {
  private static errors: Array<{
    error: Error
    info: ErrorInfo
    context?: string
  }> = []
  
  static logError(
    error: Error,
    info: ErrorInfo,
    context?: string
  ): void {
    const errorEntry = { error, info, context }
    this.errors.push(errorEntry)
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100)
    }
    
    console.error(
      `Messaging Error ${context ? `(${context})` : ''}:`,
      error.message,
      {
        error,
        info,
        stack: error.stack
      }
    )
    
    // Could send to error reporting service here
  }
  
  static getRecentErrors(): typeof MessageErrorHandler.errors {
    return [...this.errors]
  }
  
  static clearErrors(): void {
    this.errors = []
  }
}

// Export singleton instances
export const memoryManager = MemoryManager.getInstance()
export const retryHandler = new RetryHandler()
export const rateLimiter = new RateLimiter(10, 1000) // 10 requests per second