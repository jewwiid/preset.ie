import { supabase } from '../supabase'

export interface OAuthLogEvent {
  event_type: 'oauth_start' | 'oauth_callback' | 'oauth_success' | 'oauth_error' | 'profile_creation' | 'profile_error'
  user_id?: string
  session_id?: string
  provider: 'google' | 'email'
  metadata?: Record<string, any>
  error_message?: string
  error_code?: string
  ip_address?: string
  user_agent?: string
  step?: string
  duration_ms?: number
}

export interface OAuthMetrics {
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  averageDuration: number
  errorsByType: Record<string, number>
  successRate: number
}

class OAuthLoggerService {
  private sessionStartTimes = new Map<string, number>()

  async logEvent(event: OAuthLogEvent) {
    try {
      // Get client IP and user agent if available
      const clientInfo = this.getClientInfo()
      
      const logEntry = {
        ...event,
        ip_address: event.ip_address || clientInfo.ip,
        user_agent: event.user_agent || clientInfo.userAgent,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 OAuth Event:', logEntry)
      }

      // Store in Supabase (you'll need to create this table)
      if (supabase) {
        const { error } = await supabase
          .from('oauth_logs')
          .insert([logEntry])

        if (error) {
          console.error('Failed to log OAuth event:', error)
        }
      }

      // Track session timing
      if (event.event_type === 'oauth_start' && event.session_id) {
        this.sessionStartTimes.set(event.session_id, Date.now())
      } else if (
        (event.event_type === 'oauth_success' || event.event_type === 'oauth_error') && 
        event.session_id &&
        this.sessionStartTimes.has(event.session_id)
      ) {
        const startTime = this.sessionStartTimes.get(event.session_id)!
        const duration = Date.now() - startTime
        this.sessionStartTimes.delete(event.session_id)
        
        // Update the log entry with duration
        if (supabase) {
          await supabase
            .from('oauth_logs')
            .update({ duration_ms: duration })
            .eq('session_id', event.session_id)
            .eq('event_type', event.event_type)
        }
      }

    } catch (error) {
      console.error('Error logging OAuth event:', error)
    }
  }

  async logOAuthStart(provider: 'google' | 'email', sessionId: string, metadata?: Record<string, any>) {
    await this.logEvent({
      event_type: 'oauth_start',
      provider,
      session_id: sessionId,
      metadata,
      step: 'initiation'
    })
  }

  async logOAuthCallback(provider: 'google' | 'email', sessionId: string, code?: string, error?: string) {
    await this.logEvent({
      event_type: 'oauth_callback',
      provider,
      session_id: sessionId,
      metadata: { 
        has_code: !!code,
        callback_error: error 
      },
      step: 'callback',
      error_message: error
    })
  }

  async logOAuthSuccess(userId: string, provider: 'google' | 'email', sessionId: string, metadata?: Record<string, any>) {
    await this.logEvent({
      event_type: 'oauth_success',
      user_id: userId,
      provider,
      session_id: sessionId,
      metadata,
      step: 'completion'
    })
  }

  async logOAuthError(
    provider: 'google' | 'email', 
    sessionId: string, 
    error: string, 
    step?: string,
    errorCode?: string,
    metadata?: Record<string, any>
  ) {
    await this.logEvent({
      event_type: 'oauth_error',
      provider,
      session_id: sessionId,
      error_message: error,
      error_code: errorCode,
      metadata,
      step: step || 'unknown'
    })
  }

  async logProfileCreation(userId: string, provider: 'google' | 'email', sessionId: string, success: boolean, error?: string) {
    await this.logEvent({
      event_type: success ? 'profile_creation' : 'profile_error',
      user_id: userId,
      provider,
      session_id: sessionId,
      error_message: error,
      step: 'profile_creation'
    })
  }

  async getMetrics(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<OAuthMetrics> {
    try {
      const hoursBack = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168 // 7 days
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data: logs, error } = await supabase
        .from('oauth_logs')
        .select('*')
        .gte('timestamp', startTime)

      if (error) throw error

      const totalAttempts = logs?.filter(log => log.event_type === 'oauth_start').length || 0
      const successfulAttempts = logs?.filter(log => log.event_type === 'oauth_success').length || 0
      const failedAttempts = logs?.filter(log => log.event_type === 'oauth_error').length || 0

      const durations = logs?.filter(log => log.duration_ms).map(log => log.duration_ms) || []
      const averageDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0

      const errorsByType: Record<string, number> = {}
      logs?.filter(log => log.event_type === 'oauth_error').forEach(log => {
        const errorType = log.error_code || log.step || 'unknown'
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1
      })

      const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0

      return {
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        averageDuration,
        errorsByType,
        successRate
      }
    } catch (error) {
      console.error('Error getting OAuth metrics:', error)
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageDuration: 0,
        errorsByType: {},
        successRate: 0
      }
    }
  }

  async getRecentErrors(limit: number = 10) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('oauth_logs')
        .select('*')
        .eq('event_type', 'oauth_error')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting recent OAuth errors:', error)
      return []
    }
  }

  async getUserJourney(userId: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('oauth_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting user OAuth journey:', error)
      return []
    }
  }

  private getClientInfo() {
    let ip = 'unknown'
    let userAgent = 'unknown'

    if (typeof window !== 'undefined') {
      userAgent = window.navigator.userAgent
      
      // In development, IP might not be available
      // In production, you might get this from headers
    }

    return { ip, userAgent }
  }

  // Generate a session ID for tracking OAuth flow
  generateSessionId(): string {
    return `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const oauthLogger = new OAuthLoggerService()

// Hook for React components to easily log OAuth events
export function useOAuthLogger() {
  const sessionId = oauthLogger.generateSessionId()

  return {
    sessionId,
    logOAuthStart: (provider: 'google' | 'email', metadata?: Record<string, any>) => 
      oauthLogger.logOAuthStart(provider, sessionId, metadata),
    logOAuthCallback: (provider: 'google' | 'email', code?: string, error?: string) =>
      oauthLogger.logOAuthCallback(provider, sessionId, code, error),
    logOAuthSuccess: (userId: string, provider: 'google' | 'email', metadata?: Record<string, any>) =>
      oauthLogger.logOAuthSuccess(userId, provider, sessionId, metadata),
    logOAuthError: (provider: 'google' | 'email', error: string, step?: string, errorCode?: string, metadata?: Record<string, any>) =>
      oauthLogger.logOAuthError(provider, sessionId, error, step, errorCode, metadata),
    logProfileCreation: (userId: string, provider: 'google' | 'email', success: boolean, error?: string) =>
      oauthLogger.logProfileCreation(userId, provider, sessionId, success, error)
  }
}
