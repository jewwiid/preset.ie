'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Clock, Users, Shield, Eye } from 'lucide-react'

interface ModerationStats {
  pending_items: number
  total_items: number
  resolved_today: number
  average_severity: number
  resolution_time_hours: number
  top_flags: Array<{
    flag: string
    count: number
    percentage: number
  }>
  activity_by_day: Record<string, {
    flagged: number
    resolved: number
  }>
  risk_distribution: {
    low: number
    medium: number
    high: number
  }
  generated_at: string
}

export function ModerationAnalytics() {
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/moderation/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching moderation stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${Math.round(hours / 24)}d`
  }

  const getEfficiencyColor = (resolvedToday: number, pending: number) => {
    const ratio = pending > 0 ? resolvedToday / pending : 1
    if (ratio >= 0.8) return 'text-primary-600'
    if (ratio >= 0.5) return 'text-primary-600'
    return 'text-destructive-600'
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 70) return 'text-destructive-600'
    if (severity >= 50) return 'text-primary-600'
    if (severity >= 30) return 'text-primary-600'
    return 'text-primary-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground-500">Loading analytics...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground-400" />
        <p className="text-muted-foreground-500">Unable to load moderation analytics</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-muted-foreground-900">Moderation Analytics</h2>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="px-4 py-2 bg-muted-100 hover:bg-muted-200 text-muted-foreground-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Items */}
        <div className="bg-background rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground-500">Pending Review</p>
              <p className="text-3xl font-bold text-muted-foreground-900">{stats.pending_items}</p>
              <p className="text-xs text-muted-foreground-400 mt-1">
                {stats.total_items > 0 
                  ? `${Math.round((stats.pending_items / stats.total_items) * 100)}% of total`
                  : 'No items'
                }
              </p>
            </div>
            <div className="flex flex-col items-center">
              <AlertTriangle className="w-8 h-8 text-primary-500" />
              {stats.pending_items > 100 && (
                <span className="text-xs text-destructive-600 mt-1">High load!</span>
              )}
            </div>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="bg-background rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground-500">Resolved Today</p>
              <p className="text-3xl font-bold text-primary-600">{stats.resolved_today}</p>
              <p className={`text-xs mt-1 ${getEfficiencyColor(stats.resolved_today, stats.pending_items)}`}>
                {stats.pending_items > 0 
                  ? `${Math.round((stats.resolved_today / stats.pending_items) * 100)}% efficiency`
                  : 'Great job!'
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        {/* Average Severity */}
        <div className="bg-background rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground-500">Average Severity</p>
              <p className={`text-3xl font-bold ${getSeverityColor(stats.average_severity)}`}>
                {stats.average_severity.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground-400 mt-1">
                {stats.average_severity >= 70 ? 'High risk content' :
                 stats.average_severity >= 50 ? 'Medium risk content' :
                 stats.average_severity >= 30 ? 'Low-medium risk' : 'Low risk content'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        {/* Resolution Time */}
        <div className="bg-background rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground-500">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-muted-foreground-900">
                {formatTime(stats.resolution_time_hours)}
              </p>
              <p className="text-xs text-muted-foreground-400 mt-1">
                {stats.resolution_time_hours < 2 ? 'Excellent response' :
                 stats.resolution_time_hours < 6 ? 'Good response' :
                 stats.resolution_time_hours < 24 ? 'Needs improvement' : 'Too slow'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Violation Types */}
        <div className="bg-background rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive-500" />
            Top Violation Types
          </h3>
          <div className="space-y-3">
            {stats.top_flags.length > 0 ? (
              stats.top_flags.slice(0, 6).map((flag) => (
                <div key={flag.flag} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm text-muted-foreground-700 capitalize min-w-0 flex-1">
                      {flag.flag.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted-200 rounded-full h-2">
                        <div
                          className="bg-destructive-500 h-2 rounded-full"
                          style={{ width: `${flag.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground-900 min-w-max">
                        {flag.count}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground-500 text-center py-4">No violations recorded</p>
            )}
          </div>
        </div>

        {/* User Risk Distribution */}
        <div className="bg-background rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            User Risk Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-500 rounded"></div>
                <span className="text-sm text-muted-foreground-700">Low Risk (0-30)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-600">
                  {stats.risk_distribution.low}
                </span>
                <span className="text-sm text-muted-foreground-500">users</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-500 rounded"></div>
                <span className="text-sm text-muted-foreground-700">Medium Risk (31-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-600">
                  {stats.risk_distribution.medium}
                </span>
                <span className="text-sm text-muted-foreground-500">users</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive-500 rounded"></div>
                <span className="text-sm text-muted-foreground-700">High Risk (70+)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-destructive-600">
                  {stats.risk_distribution.high}
                </span>
                <span className="text-sm text-muted-foreground-500">users</span>
                {stats.risk_distribution.high > 5 && (
                  <span className="text-xs text-destructive-600 ml-1">⚠️</span>
                )}
              </div>
            </div>
            
            {/* Total users */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground-700">Total Active Users</span>
                <span className="text-lg font-bold text-muted-foreground-900">
                  {stats.risk_distribution.low + stats.risk_distribution.medium + stats.risk_distribution.high}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Chart */}
      <div className="bg-background rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          Recent Activity (Last 7 Days)
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.activity_by_day)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 7)
            .map(([date, activity]) => (
              <div key={date} className="flex items-center gap-4 py-2">
                <div className="w-20 text-sm text-muted-foreground-600">
                  {new Date(date).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-xs text-muted-foreground-500 w-12">Flagged:</div>
                    <div className="flex-1 bg-muted-200 rounded h-2">
                      <div
                        className="bg-destructive-400 h-2 rounded"
                        style={{ 
                          width: `${Math.min(100, (activity.flagged / Math.max(activity.flagged, activity.resolved, 1)) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {activity.flagged}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="text-xs text-muted-foreground-500 w-14">Resolved:</div>
                  <div className="flex-1 bg-muted-200 rounded h-2">
                    <div
                      className="bg-primary-400 h-2 rounded"
                      style={{ 
                        width: `${Math.min(100, (activity.resolved / Math.max(activity.flagged, activity.resolved, 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {activity.resolved}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground-400">
        <p>Last updated: {new Date(stats.generated_at).toLocaleString()}</p>
      </div>
    </div>
  )
}