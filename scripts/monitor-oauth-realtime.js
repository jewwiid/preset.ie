#!/usr/bin/env node

/**
 * Real-time OAuth monitoring script
 * Run with: node scripts/monitor-oauth-realtime.js
 * 
 * This script provides real-time monitoring of OAuth flows and alerts
 * when issues are detected.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class OAuthMonitor {
  constructor() {
    this.isRunning = false
    this.errorThreshold = 5 // Alert after 5 consecutive errors
    this.successThreshold = 0.8 // Alert if success rate drops below 80%
    this.timeWindow = 10 * 60 * 1000 // 10 minutes
    this.lastAlertTime = new Map()
    this.alertCooldown = 5 * 60 * 1000 // 5 minute cooldown between alerts
    
    // Colors for console output
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      reset: '\x1b[0m',
      bright: '\x1b[1m'
    }
  }

  log(message, color = 'white') {
    const timestamp = new Date().toISOString()
    console.log(`${this.colors[color]}[${timestamp}] ${message}${this.colors.reset}`)
  }

  async start() {
    this.log('🚀 Starting OAuth real-time monitor...', 'cyan')
    this.isRunning = true

    // Initial system check
    await this.performSystemCheck()

    // Set up real-time monitoring
    this.setupRealtimeSubscription()
    
    // Periodic health checks
    setInterval(() => this.performHealthCheck(), 60000) // Every minute
    setInterval(() => this.performSystemCheck(), 300000) // Every 5 minutes

    // Keep the process running
    process.on('SIGINT', () => {
      this.log('🛑 Shutting down OAuth monitor...', 'yellow')
      this.isRunning = false
      process.exit(0)
    })

    this.log('✅ OAuth monitor is running. Press Ctrl+C to stop.', 'green')
  }

  setupRealtimeSubscription() {
    // Subscribe to oauth_logs table for real-time events
    const subscription = supabase
      .channel('oauth_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'oauth_logs'
        },
        (payload) => {
          this.handleOAuthEvent(payload.new)
        }
      )
      .subscribe()

    this.log('📡 Subscribed to real-time OAuth events', 'blue')
  }

  handleOAuthEvent(event) {
    const { event_type, provider, error_message, step, session_id, user_id } = event

    switch (event_type) {
      case 'oauth_start':
        this.log(`🔵 OAuth started: ${provider} (session: ${session_id})`, 'blue')
        break
      
      case 'oauth_success':
        this.log(`✅ OAuth success: ${provider} (user: ${user_id})`, 'green')
        break
      
      case 'oauth_error':
        this.log(`❌ OAuth error: ${provider} at ${step} - ${error_message}`, 'red')
        this.checkForErrorPatterns(event)
        break
      
      case 'profile_creation':
        this.log(`👤 Profile created: ${provider} (user: ${user_id})`, 'green')
        break
      
      case 'profile_error':
        this.log(`⚠️  Profile creation failed: ${provider} - ${error_message}`, 'yellow')
        break
      
      default:
        this.log(`📝 OAuth event: ${event_type} (${provider})`, 'white')
    }
  }

  async checkForErrorPatterns(errorEvent) {
    // Check for error patterns that might indicate system issues
    const { error_code, step, provider } = errorEvent

    // Check recent error rate
    const recentErrors = await this.getRecentErrors(provider, 10)
    
    if (recentErrors.length >= this.errorThreshold) {
      await this.sendAlert(`HIGH ERROR RATE`, `${provider} OAuth has ${recentErrors.length} recent errors`)
    }

    // Check for specific error patterns
    if (error_code === 'TIMEOUT' || step === 'profile_creation') {
      await this.sendAlert(`SYSTEM ISSUE`, `${provider} OAuth failing at ${step}: ${errorEvent.error_message}`)
    }
  }

  async performHealthCheck() {
    try {
      const metrics = await this.getOAuthMetrics(10) // Last 10 minutes
      
      if (metrics.total_attempts > 0) {
        const successRate = metrics.successful_attempts / metrics.total_attempts
        
        if (successRate < this.successThreshold) {
          await this.sendAlert(
            'LOW SUCCESS RATE', 
            `OAuth success rate is ${(successRate * 100).toFixed(1)}% (${metrics.successful_attempts}/${metrics.total_attempts})`
          )
        }
      }

      // Check for stuck sessions
      const stuckSessions = await this.getStuckSessions()
      if (stuckSessions.length > 0) {
        await this.sendAlert(
          'STUCK SESSIONS',
          `Found ${stuckSessions.length} OAuth sessions stuck for >10 minutes`
        )
      }

    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`, 'red')
    }
  }

  async performSystemCheck() {
    this.log('🔍 Performing system check...', 'cyan')
    
    try {
      // Check database connectivity
      const { data: users, error: userError } = await supabase
        .rpc('get_oauth_metrics', { hours_back: 1 })

      if (userError) {
        this.log(`❌ Database connectivity issue: ${userError.message}`, 'red')
        return
      }

      // Display OAuth metrics
      const metrics = users?.[0] || {}
      this.log(`📊 OAuth Metrics: ${metrics.total_attempts || 0} attempts, ${metrics.successful_attempts || 0} successes`, 'cyan')

      // Check OAuth logs table
      const { data: logs, error: logError } = await supabase
        .from('oauth_logs')
        .select('count')
        .limit(1)

      if (logError) {
        this.log(`⚠️  OAuth logs table issue: ${logError.message}`, 'yellow')
      }

      // Check for orphaned users (users without profiles)
      const orphanedUsers = await this.getOrphanedUsers()
      if (orphanedUsers > 0) {
        this.log(`⚠️  Found ${orphanedUsers} users without profiles`, 'yellow')
      }

      // Check recent activity
      const recentActivity = await this.getRecentActivity()
      this.log(`📊 System status: ${recentActivity.total_events} events in last hour`, 'cyan')

    } catch (error) {
      this.log(`❌ System check failed: ${error.message}`, 'red')
    }
  }

  async getOAuthMetrics(minutes = 60) {
    const { data, error } = await supabase.rpc('get_oauth_metrics', { 
      hours_back: Math.ceil(minutes / 60) 
    })

    if (error) throw error
    return data[0] || {
      total_attempts: 0,
      successful_attempts: 0,
      failed_attempts: 0,
      success_rate: 0
    }
  }

  async getRecentErrors(provider = null, limit = 10) {
    let query = supabase
      .from('oauth_logs')
      .select('*')
      .eq('event_type', 'oauth_error')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (provider) {
      query = query.eq('provider', provider)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getStuckSessions() {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      
      // Get all oauth_start sessions from 10+ minutes ago
      const { data: startSessions, error: startError } = await supabase
        .from('oauth_logs')
        .select('session_id, provider, timestamp')
        .eq('event_type', 'oauth_start')
        .lt('timestamp', tenMinutesAgo)

      if (startError) throw startError

      // Get all completed sessions
      const { data: completedSessions, error: completedError } = await supabase
        .from('oauth_logs')
        .select('session_id')
        .in('event_type', ['oauth_success', 'oauth_error'])

      if (completedError) throw completedError

      const completedSessionIds = new Set(completedSessions?.map(s => s.session_id) || [])
      
      // Filter out completed sessions
      const stuckSessions = startSessions?.filter(s => !completedSessionIds.has(s.session_id)) || []
      
      return stuckSessions
    } catch (error) {
      this.log(`Error getting stuck sessions: ${error.message}`, 'yellow')
      return []
    }
  }

  async getOrphanedUsers() {
    // Use the diagnose function instead of direct auth.users access
    try {
      const { data, error } = await supabase
        .rpc('diagnose_oauth_system')

      if (error) throw error

      const userProfileData = data?.find(d => d.component === 'users_profile')
      return userProfileData?.details?.orphaned_users || 0
    } catch (error) {
      this.log(`Could not get orphaned users: ${error.message}`, 'yellow')
      return 0
    }
  }

  async getRecentActivity() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('oauth_logs')
      .select('event_type')
      .gte('timestamp', oneHourAgo)

    if (error) throw error

    const events = data || []
    return {
      total_events: events.length,
      starts: events.filter(e => e.event_type === 'oauth_start').length,
      successes: events.filter(e => e.event_type === 'oauth_success').length,
      errors: events.filter(e => e.event_type === 'oauth_error').length
    }
  }

  async sendAlert(type, message) {
    const alertKey = `${type}_${message.substring(0, 50)}`
    const now = Date.now()
    const lastAlert = this.lastAlertTime.get(alertKey)

    // Check cooldown
    if (lastAlert && (now - lastAlert) < this.alertCooldown) {
      return
    }

    this.lastAlertTime.set(alertKey, now)
    
    // Log alert
    this.log(`🚨 ALERT [${type}]: ${message}`, 'red')

    // Here you could send alerts to Slack, email, etc.
    // For now, we'll just log to console
    
    // Example Slack webhook (uncomment and configure if needed):
    // if (process.env.SLACK_WEBHOOK_URL) {
    //   await this.sendSlackAlert(type, message)
    // }
  }

  async sendSlackAlert(type, message) {
    // Implementation for Slack alerts
    // You can uncomment and configure this if you have Slack webhooks set up
    /*
    const webhook = process.env.SLACK_WEBHOOK_URL
    if (!webhook) return

    const payload = {
      text: `🚨 OAuth Alert: ${type}`,
      attachments: [{
        color: 'danger',
        fields: [{
          title: 'Issue',
          value: message,
          short: false
        }, {
          title: 'Timestamp',
          value: new Date().toISOString(),
          short: true
        }]
      }]
    }

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    */
  }
}

// Start the monitor
const monitor = new OAuthMonitor()
monitor.start().catch(error => {
  console.error('Failed to start OAuth monitor:', error)
  process.exit(1)
})
