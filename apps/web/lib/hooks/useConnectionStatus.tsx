'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth-context'
import { supabase } from '../supabase'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'reconnecting'

export interface ConnectionQuality {
  latency: number | null // ms
  lastPing: string | null
  successRate: number // 0-1
  totalAttempts: number
  successfulAttempts: number
}

export interface UseConnectionStatusOptions {
  enableHeartbeat?: boolean
  heartbeatInterval?: number // ms
  reconnectAttempts?: number
  reconnectDelay?: number // ms
  enableNetworkDetection?: boolean
  pingTimeout?: number // ms
}

export interface UseConnectionStatusResult {
  // Status
  status: ConnectionStatus
  isOnline: boolean
  isConnected: boolean
  quality: ConnectionQuality
  
  // Connection info
  lastConnected: string | null
  lastDisconnected: string | null
  connectionError: string | null
  reconnectAttempt: number
  
  // Actions
  reconnect: () => void
  ping: () => Promise<number | null>
  resetConnectionStats: () => void
  
  // Events
  onStatusChange?: (status: ConnectionStatus) => void
  onQualityChange?: (quality: ConnectionQuality) => void
}

export function useConnectionStatus(options: UseConnectionStatusOptions = {}): UseConnectionStatusResult {
  const { user } = useAuth()
  
  const {
    enableHeartbeat = true,
    heartbeatInterval = 30000, // 30 seconds
    reconnectAttempts = 5,
    reconnectDelay = 2000, // 2 seconds
    enableNetworkDetection = true,
    pingTimeout = 10000 // 10 seconds
  } = options

  // State
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [quality, setQuality] = useState<ConnectionQuality>({
    latency: null,
    lastPing: null,
    successRate: 1,
    totalAttempts: 0,
    successfulAttempts: 0
  })
  
  const [lastConnected, setLastConnected] = useState<string | null>(null)
  const [lastDisconnected, setLastDisconnected] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  // Refs
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const statusChangeCallbackRef = useRef<((status: ConnectionStatus) => void) | undefined>(undefined)
  const qualityChangeCallbackRef = useRef<((quality: ConnectionQuality) => void) | undefined>(undefined)

  // Derived state
  const isConnected = status === 'connected'

  // Ping function to test connection
  const ping = useCallback(async (): Promise<number | null> => {
    const startTime = Date.now()
    
    try {
      // Use a simple query to test the connection with manual timeout
      const queryPromise = supabase
        .from('users_profile')
        .select('id')
        .limit(1)
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), pingTimeout)
      })
      
      const { error } = await Promise.race([queryPromise, timeoutPromise]) as any

      const latency = Date.now() - startTime

      if (error) {
        throw new Error(error.message)
      }

      // Update quality metrics
      setQuality(prev => {
        const newQuality = {
          ...prev,
          latency,
          lastPing: new Date().toISOString(),
          totalAttempts: prev.totalAttempts + 1,
          successfulAttempts: prev.successfulAttempts + 1,
          successRate: (prev.successfulAttempts + 1) / (prev.totalAttempts + 1)
        }
        
        qualityChangeCallbackRef.current?.(newQuality)
        return newQuality
      })

      return latency

    } catch (error: any) {
      console.error('Connection ping failed:', error)

      // Update quality metrics for failed attempt
      setQuality(prev => {
        const newQuality = {
          ...prev,
          lastPing: new Date().toISOString(),
          totalAttempts: prev.totalAttempts + 1,
          successRate: prev.successfulAttempts / (prev.totalAttempts + 1)
        }
        
        qualityChangeCallbackRef.current?.(newQuality)
        return newQuality
      })

      return null
    }
  }, [pingTimeout])

  // Update connection status
  const updateStatus = useCallback((newStatus: ConnectionStatus, error?: string) => {
    console.log(`Connection status changed: ${status} -> ${newStatus}`)
    
    setStatus(prev => {
      if (prev !== newStatus) {
        const now = new Date().toISOString()
        
        if (newStatus === 'connected') {
          setLastConnected(now)
          setConnectionError(null)
          setReconnectAttempt(0)
        } else if (prev === 'connected') {
          setLastDisconnected(now)
        }
        
        if (error) {
          setConnectionError(error)
        } else if (newStatus === 'connected') {
          setConnectionError(null)
        }
        
        statusChangeCallbackRef.current?.(newStatus)
        
        return newStatus
      }
      return prev
    })
  }, [status])

  // Check connection status
  const checkConnection = useCallback(async () => {
    if (!isOnline) {
      updateStatus('disconnected', 'No internet connection')
      return false
    }

    const latency = await ping()
    
    if (latency !== null) {
      if (status !== 'connected') {
        updateStatus('connected')
      }
      return true
    } else {
      updateStatus('error', 'Connection test failed')
      return false
    }
  }, [isOnline, ping, status, updateStatus])

  // Reconnection logic with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempt >= reconnectAttempts) {
      updateStatus('error', `Failed to reconnect after ${reconnectAttempts} attempts`)
      return
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttempt) // Exponential backoff
    
    console.log(`Scheduling reconnect attempt ${reconnectAttempt + 1} in ${delay}ms`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempt(prev => prev + 1)
      updateStatus('reconnecting')
      checkConnection()
    }, delay) as unknown as NodeJS.Timeout
  }, [reconnectAttempt, reconnectAttempts, reconnectDelay, checkConnection, updateStatus])

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setReconnectAttempt(0)
    setConnectionError(null)
    updateStatus('connecting')
    checkConnection()
  }, [checkConnection, updateStatus])

  // Reset connection statistics
  const resetConnectionStats = useCallback(() => {
    setQuality({
      latency: null,
      lastPing: null,
      successRate: 1,
      totalAttempts: 0,
      successfulAttempts: 0
    })
    setReconnectAttempt(0)
    setConnectionError(null)
  }, [])

  // Setup heartbeat
  useEffect(() => {
    if (!enableHeartbeat || !user) return

    const startHeartbeat = () => {
      heartbeatIntervalRef.current = setInterval(async () => {
        if (status === 'connected' || status === 'connecting') {
          const isConnected = await checkConnection()
          
          if (!isConnected && status === 'connected') {
            updateStatus('disconnected')
            scheduleReconnect()
          }
        }
      }, heartbeatInterval) as unknown as NodeJS.Timeout
    }

    startHeartbeat()

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [enableHeartbeat, user, status, heartbeatInterval, checkConnection, updateStatus, scheduleReconnect])

  // Setup network detection
  useEffect(() => {
    if (!enableNetworkDetection) return

    const handleOnline = () => {
      console.log('Network: online')
      setIsOnline(true)
      if (status === 'disconnected') {
        reconnect()
      }
    }

    const handleOffline = () => {
      console.log('Network: offline')
      setIsOnline(false)
      updateStatus('disconnected', 'Network offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enableNetworkDetection, status, reconnect, updateStatus])

  // Initial connection check
  useEffect(() => {
    if (user && status === 'connecting') {
      checkConnection()
    }
  }, [user, status, checkConnection])

  // Monitor Supabase connection
  useEffect(() => {
    if (!user) return

    // Listen to Supabase connection events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        updateStatus('disconnected', 'User signed out')
      } else if (event === 'SIGNED_IN' && session) {
        if (status !== 'connected') {
          checkConnection()
        }
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [user, status, checkConnection, updateStatus])

  // Setup automatic reconnection on status change
  useEffect(() => {
    if (status === 'error' || status === 'disconnected') {
      if (isOnline && reconnectAttempt < reconnectAttempts) {
        scheduleReconnect()
      }
    }
  }, [status, isOnline, reconnectAttempt, reconnectAttempts, scheduleReconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    isOnline,
    isConnected,
    quality,
    lastConnected,
    lastDisconnected,
    connectionError,
    reconnectAttempt,
    reconnect,
    ping,
    resetConnectionStats,
    onStatusChange: statusChangeCallbackRef.current,
    onQualityChange: qualityChangeCallbackRef.current
  }
}

// Helper hook for component-specific connection monitoring
export function useComponentConnectionStatus(componentName: string) {
  const connection = useConnectionStatus()
  
  useEffect(() => {
    if (connection.status === 'connected') {
      console.log(`${componentName}: Connection restored`)
    } else if (connection.status === 'error' || connection.status === 'disconnected') {
      console.log(`${componentName}: Connection lost - ${connection.connectionError || 'Unknown error'}`)
    }
  }, [connection.status, connection.connectionError, componentName])
  
  return connection
}