'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Users, Database } from 'lucide-react'

interface OAuthMetrics {
  totalUsers: number
  googleUsers: number
  recentAttempts: number
  failedAttempts: number
  successRate: number
  lastHourAttempts: number
}

interface RecentOAuthAttempt {
  id: string
  created_at: string
  instance_id: string
  ip_address: string
  user_agent?: string
  payload: any
}

interface RecentUser {
  id: string
  email: string
  created_at: string
  provider: string
  full_name?: string
  has_profile: boolean
}

interface TriggerStatus {
  trigger_name: string
  enabled: boolean
  definition: string
}

export default function OAuthMonitorPage() {
  const [metrics, setMetrics] = useState<OAuthMetrics | null>(null)
  const [recentAttempts, setRecentAttempts] = useState<RecentOAuthAttempt[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [triggerStatus, setTriggerStatus] = useState<TriggerStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      setError(null)
      
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      // Get total user count
      const { count: totalUsers } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true })

      // Get Google users count
      const { count: googleUsers } = await (supabase as any)
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
        .eq('raw_app_meta_data->provider', 'google')

      // Get recent attempts (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count: lastHourAttempts } = await supabase
        .from('auth.audit_log_entries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo)

      // Calculate success rate (simplified)
      const successRate = totalUsers && lastHourAttempts 
        ? Math.min(100, (totalUsers / Math.max(lastHourAttempts, 1)) * 100)
        : 0

      setMetrics({
        totalUsers: totalUsers || 0,
        googleUsers: googleUsers || 0,
        recentAttempts: lastHourAttempts || 0,
        failedAttempts: 0, // Would need more complex query
        successRate,
        lastHourAttempts: lastHourAttempts || 0
      })

    } catch (err: any) {
      console.error('Error fetching metrics:', err)
      setError(err.message)
    }
  }

  const fetchRecentAttempts = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      const { data, error } = await (supabase as any)
        .from('auth.audit_log_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentAttempts(data || [])
    } catch (err: any) {
      console.error('Error fetching recent attempts:', err)
    }
  }

  const fetchRecentUsers = async () => {
    try {
      // This would need a custom function or RPC call in production
      // For now, we'll simulate the data structure
      const { data: users, error } = await (supabase as any)
        .from('auth.users')
        .select('id, email, created_at, raw_app_meta_data, raw_user_meta_data')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Check which users have profiles
      const userIds = users?.map((u: any) => u.id) || []
      const { data: profiles, error: profilesError } = await supabase!
        .from('users_profile')
        .select('user_id')
        .in('user_id', userIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }

      const profileUserIds = new Set(
        profiles?.map((p: any) => p.user_id).filter((id: any) => id != null) || []
      )

      const enrichedUsers = users?.map((user: any) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        provider: user.raw_app_meta_data?.provider || 'email',
        full_name: user.raw_user_meta_data?.full_name,
        has_profile: profileUserIds.has(user.id)
      })) || []

      setRecentUsers(enrichedUsers)
    } catch (err: any) {
      console.error('Error fetching recent users:', err)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([
      fetchMetrics(),
      fetchRecentAttempts(),
      fetchRecentUsers()
    ])
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => {
    refreshData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (successRate: number) => {
    if (successRate >= 90) return 'text-green-600'
    if (successRate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 90) return <CheckCircle className="w-4 h-4" />
    if (successRate >= 70) return <AlertTriangle className="w-4 h-4" />
    return <XCircle className="w-4 h-4" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OAuth Monitor</h1>
          <p className="text-gray-600">Real-time monitoring of Google OAuth flow</p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={refreshData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Google Users</CardTitle>
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.googleUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics && metrics.totalUsers > 0 
                ? `${Math.round((metrics.googleUsers / metrics.totalUsers) * 100)}% of total`
                : '0% of total'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Hour Attempts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.lastHourAttempts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            {metrics && getStatusIcon(metrics.successRate)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics ? getStatusColor(metrics.successRate) : ''}`}>
              {metrics ? `${Math.round(metrics.successRate)}%` : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent User Registrations</CardTitle>
          <CardDescription>Latest users who signed up through OAuth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.length > 0 ? recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-gray-500">
                      {user.full_name || 'No display name'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.provider === 'google' ? 'default' : 'secondary'}>
                    {user.provider}
                  </Badge>
                  <Badge variant={user.has_profile ? 'default' : 'destructive'}>
                    {user.has_profile ? 'Profile ✓' : 'No Profile'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                No recent users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent OAuth Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent OAuth Attempts</CardTitle>
          <CardDescription>Authentication flow audit log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAttempts.length > 0 ? recentAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="font-medium">Auth Event</div>
                    <div className="text-sm text-gray-500">
                      IP: {attempt.ip_address || 'Unknown'}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(attempt.created_at).toLocaleString()}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                No recent attempts found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
