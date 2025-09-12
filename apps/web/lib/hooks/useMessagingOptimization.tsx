'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { 
  useDebounce, 
  useThrottle, 
  MessageBatcher,
  LRUCache,
  RateLimiter,
  RetryHandler,
  memoryManager,
  usePerformanceMonitor,
  MessageErrorHandler
} from '../utils/messaging-performance'

export interface MessagingOptimizationOptions {
  // Debouncing options
  typingDebounceDelay?: number
  searchDebounceDelay?: number
  
  // Throttling options
  scrollThrottleDelay?: number
  resizeThrottleDelay?: number
  
  // Batching options
  messageBatchSize?: number
  messageBatchDelay?: number
  updateBatchSize?: number
  updateBatchDelay?: number
  
  // Caching options
  messagesCacheSize?: number
  conversationsCacheSize?: number
  usersCacheSize?: number
  
  // Rate limiting
  apiCallsPerSecond?: number
  
  // Performance monitoring
  enablePerformanceMonitoring?: boolean
  slowRenderThreshold?: number // ms
  
  // Memory management
  enableMemoryManagement?: boolean
  memoryCleanupInterval?: number // ms
  
  // Error handling
  enableRetry?: boolean
  maxRetryAttempts?: number
  retryBaseDelay?: number
}

export interface UseMessagingOptimizationResult {
  // Debounced functions
  debouncedTyping: (callback: () => void) => void
  debouncedSearch: (callback: () => void) => void
  
  // Throttled functions
  throttledScroll: (callback: () => void) => void
  throttledResize: (callback: () => void) => void
  
  // Batching
  batchMessage: (message: any) => void
  batchUpdate: (update: any) => void
  flushBatches: () => void
  
  // Caching
  cacheMessage: (id: string, message: any) => void
  getCachedMessage: (id: string) => any
  cacheConversation: (id: string, conversation: any) => void
  getCachedConversation: (id: string) => any
  cacheUser: (id: string, user: any) => void
  getCachedUser: (id: string) => any
  clearCaches: () => void
  
  // Rate limiting
  canMakeApiCall: () => boolean
  recordApiCall: () => boolean
  getApiCallsRemaining: () => number
  
  // Performance monitoring
  performanceMetrics: ReturnType<typeof usePerformanceMonitor>
  recordSlowOperation: (name: string, duration: number) => void
  
  // Memory management
  getMemoryUsage: () => any
  forceCleanup: () => void
  
  // Error handling
  executeWithRetry: <T>(operation: () => Promise<T>, context?: string) => Promise<T>
  logError: (error: Error, context?: string) => void
  getRecentErrors: () => any[]
  
  // Optimization stats
  optimizationStats: {
    messagesProcessed: number
    updatesProcessed: number
    cacheHits: number
    cacheMisses: number
    apiCallsBlocked: number
    errorsHandled: number
    retryAttempts: number
  }
}

export function useMessagingOptimization(
  componentName: string,
  options: MessagingOptimizationOptions = {}
): UseMessagingOptimizationResult {
  const {
    typingDebounceDelay = 1000,
    searchDebounceDelay = 300,
    scrollThrottleDelay = 16,
    resizeThrottleDelay = 100,
    messageBatchSize = 20,
    messageBatchDelay = 500,
    updateBatchSize = 10,
    updateBatchDelay = 200,
    messagesCacheSize = 500,
    conversationsCacheSize = 50,
    usersCacheSize = 200,
    apiCallsPerSecond = 10,
    enablePerformanceMonitoring = true,
    slowRenderThreshold = 16,
    enableMemoryManagement = true,
    memoryCleanupInterval = 60000,
    enableRetry = true,
    maxRetryAttempts = 3,
    retryBaseDelay = 1000
  } = options

  // State for optimization stats
  const [optimizationStats, setOptimizationStats] = useState({
    messagesProcessed: 0,
    updatesProcessed: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCallsBlocked: 0,
    errorsHandled: 0,
    retryAttempts: 0
  })

  // Refs for batchers and utilities
  const messageBatcherRef = useRef<MessageBatcher<any> | null>(null)
  const updateBatcherRef = useRef<MessageBatcher<any> | null>(null)
  const rateLimiterRef = useRef<RateLimiter | null>(null)
  const retryHandlerRef = useRef<RetryHandler | null>(null)
  const cachesRef = useRef<{
    messages: LRUCache<string, any>
    conversations: LRUCache<string, any>
    users: LRUCache<string, any>
  } | null>(null)

  // Initialize utilities
  useEffect(() => {
    // Initialize message batcher
    messageBatcherRef.current = new MessageBatcher(
      (batch) => {
        setOptimizationStats(prev => ({
          ...prev,
          messagesProcessed: prev.messagesProcessed + batch.items.length
        }))
        console.debug(`Processed message batch of ${batch.items.length} items`)
      },
      messageBatchSize,
      messageBatchDelay
    )

    // Initialize update batcher
    updateBatcherRef.current = new MessageBatcher(
      (batch) => {
        setOptimizationStats(prev => ({
          ...prev,
          updatesProcessed: prev.updatesProcessed + batch.items.length
        }))
        console.debug(`Processed update batch of ${batch.items.length} items`)
      },
      updateBatchSize,
      updateBatchDelay
    )

    // Initialize rate limiter
    rateLimiterRef.current = new RateLimiter(apiCallsPerSecond, 1000)

    // Initialize retry handler
    retryHandlerRef.current = new RetryHandler({
      maxAttempts: maxRetryAttempts,
      baseDelay: retryBaseDelay,
      shouldRetry: (error: any) => !error?.permanent && !error?.status?.toString().startsWith('4')
    })

    // Initialize caches
    cachesRef.current = {
      messages: memoryManager.getCache(`${componentName}-messages`, messagesCacheSize),
      conversations: memoryManager.getCache(`${componentName}-conversations`, conversationsCacheSize),
      users: memoryManager.getCache(`${componentName}-users`, usersCacheSize)
    }

    return () => {
      // Cleanup batchers
      messageBatcherRef.current?.clear()
      updateBatcherRef.current?.clear()
    }
  }, [
    componentName,
    messageBatchSize,
    messageBatchDelay,
    updateBatchSize,
    updateBatchDelay,
    apiCallsPerSecond,
    maxRetryAttempts,
    retryBaseDelay,
    messagesCacheSize,
    conversationsCacheSize,
    usersCacheSize
  ])

  // Performance monitoring
  const performanceMetrics = usePerformanceMonitor(componentName)

  // Debounced functions
  const debouncedTyping = useDebounce((callback: () => void) => {
    callback()
  }, typingDebounceDelay)

  const debouncedSearch = useDebounce((callback: () => void) => {
    callback()
  }, searchDebounceDelay)

  // Throttled functions
  const throttledScroll = useThrottle((callback: () => void) => {
    callback()
  }, scrollThrottleDelay)

  const throttledResize = useThrottle((callback: () => void) => {
    callback()
  }, resizeThrottleDelay)

  // Batching functions
  const batchMessage = useCallback((message: any) => {
    messageBatcherRef.current?.add(message)
  }, [])

  const batchUpdate = useCallback((update: any) => {
    updateBatcherRef.current?.add(update)
  }, [])

  const flushBatches = useCallback(() => {
    messageBatcherRef.current?.flush()
    updateBatcherRef.current?.flush()
  }, [])

  // Caching functions
  const cacheMessage = useCallback((id: string, message: any) => {
    cachesRef.current?.messages.set(id, message)
  }, [])

  const getCachedMessage = useCallback((id: string) => {
    const cached = cachesRef.current?.messages.get(id)
    setOptimizationStats(prev => ({
      ...prev,
      cacheHits: cached ? prev.cacheHits + 1 : prev.cacheHits,
      cacheMisses: cached ? prev.cacheMisses : prev.cacheMisses + 1
    }))
    return cached
  }, [])

  const cacheConversation = useCallback((id: string, conversation: any) => {
    cachesRef.current?.conversations.set(id, conversation)
  }, [])

  const getCachedConversation = useCallback((id: string) => {
    const cached = cachesRef.current?.conversations.get(id)
    setOptimizationStats(prev => ({
      ...prev,
      cacheHits: cached ? prev.cacheHits + 1 : prev.cacheHits,
      cacheMisses: cached ? prev.cacheMisses : prev.cacheMisses + 1
    }))
    return cached
  }, [])

  const cacheUser = useCallback((id: string, user: any) => {
    cachesRef.current?.users.set(id, user)
  }, [])

  const getCachedUser = useCallback((id: string) => {
    const cached = cachesRef.current?.users.get(id)
    setOptimizationStats(prev => ({
      ...prev,
      cacheHits: cached ? prev.cacheHits + 1 : prev.cacheHits,
      cacheMisses: cached ? prev.cacheMisses : prev.cacheMisses + 1
    }))
    return cached
  }, [])

  const clearCaches = useCallback(() => {
    cachesRef.current?.messages.clear()
    cachesRef.current?.conversations.clear()
    cachesRef.current?.users.clear()
  }, [])

  // Rate limiting functions
  const canMakeApiCall = useCallback(() => {
    return rateLimiterRef.current?.canMakeRequest() ?? true
  }, [])

  const recordApiCall = useCallback(() => {
    const allowed = rateLimiterRef.current?.recordRequest() ?? true
    if (!allowed) {
      setOptimizationStats(prev => ({
        ...prev,
        apiCallsBlocked: prev.apiCallsBlocked + 1
      }))
    }
    return allowed
  }, [])

  const getApiCallsRemaining = useCallback(() => {
    // Simplified calculation - in practice you'd want more sophisticated tracking
    return apiCallsPerSecond - (rateLimiterRef.current?.['requests']?.length || 0)
  }, [apiCallsPerSecond])

  // Performance monitoring functions
  const recordSlowOperation = useCallback((name: string, duration: number) => {
    if (duration > slowRenderThreshold) {
      console.warn(`${componentName}: Slow operation detected - ${name} took ${duration}ms`)
    }
  }, [componentName, slowRenderThreshold])

  // Memory management functions
  const getMemoryUsage = useCallback(() => {
    return {
      component: componentName,
      caches: {
        messages: cachesRef.current?.messages.size || 0,
        conversations: cachesRef.current?.conversations.size || 0,
        users: cachesRef.current?.users.size || 0
      },
      performance: performanceMetrics,
      stats: optimizationStats
    }
  }, [componentName, performanceMetrics, optimizationStats])

  const forceCleanup = useCallback(() => {
    clearCaches()
    flushBatches()
    memoryManager.clearCache(`${componentName}-messages`)
    memoryManager.clearCache(`${componentName}-conversations`)
    memoryManager.clearCache(`${componentName}-users`)
  }, [componentName, clearCaches, flushBatches])

  // Error handling functions
  const executeWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    try {
      const result = await retryHandlerRef.current!.execute(operation, context)
      return result
    } catch (error: any) {
      setOptimizationStats(prev => ({
        ...prev,
        errorsHandled: prev.errorsHandled + 1,
        retryAttempts: prev.retryAttempts + (error.attempts || 0)
      }))
      throw error
    }
  }, [])

  const logError = useCallback((error: Error, context?: string) => {
    MessageErrorHandler.logError(error, {
      componentStack: componentName,
      timestamp: Date.now(),
      eventType: 'optimization_error'
    }, context)
    
    setOptimizationStats(prev => ({
      ...prev,
      errorsHandled: prev.errorsHandled + 1
    }))
  }, [componentName])

  const getRecentErrors = useCallback(() => {
    return MessageErrorHandler.getRecentErrors()
  }, [])

  // Memory cleanup effect
  useEffect(() => {
    if (!enableMemoryManagement) return

    const interval = setInterval(() => {
      // Log memory usage periodically
      console.debug(`${componentName} memory usage:`, getMemoryUsage())
      
      // Auto-cleanup if memory usage is high
      const memoryUsage = getMemoryUsage()
      const totalCacheSize = Object.values(memoryUsage.caches).reduce((sum, size) => sum + size, 0)
      
      if (totalCacheSize > (messagesCacheSize + conversationsCacheSize + usersCacheSize) * 0.8) {
        console.warn(`${componentName}: High memory usage detected, forcing cleanup`)
        forceCleanup()
      }
    }, memoryCleanupInterval)

    return () => clearInterval(interval)
  }, [
    enableMemoryManagement,
    componentName,
    memoryCleanupInterval,
    getMemoryUsage,
    forceCleanup,
    messagesCacheSize,
    conversationsCacheSize,
    usersCacheSize
  ])

  return {
    debouncedTyping,
    debouncedSearch,
    throttledScroll,
    throttledResize,
    batchMessage,
    batchUpdate,
    flushBatches,
    cacheMessage,
    getCachedMessage,
    cacheConversation,
    getCachedConversation,
    cacheUser,
    getCachedUser,
    clearCaches,
    canMakeApiCall,
    recordApiCall,
    getApiCallsRemaining,
    performanceMetrics,
    recordSlowOperation,
    getMemoryUsage,
    forceCleanup,
    executeWithRetry,
    logError,
    getRecentErrors,
    optimizationStats
  }
}