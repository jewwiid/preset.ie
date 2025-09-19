'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  MessageSquare,
  Calendar,
  BarChart3,
  Activity,
  Award,
  Clock
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'

interface MatchmakingAnalyticsProps {
  userId: string
  timeRange: 'week' | 'month' | 'quarter'
  className?: string
}

interface AnalyticsData {
  avgCompatibility: number
  totalInteractions: number
  applicationsSent: number
  successfulMatches: number
  engagementScore: number
  compatibilityTrends: Array<{
    date: string
    avg_compatibility: number
    total_calculations: number
  }>
  topMatchFactors: Array<{
    factor: string
    count: number
    percentage: number
  }>
}

const MatchmakingAnalytics: React.FC<MatchmakingAnalyticsProps> = ({
  userId,
  timeRange,
  className = ''
}) => {
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData()
    }
  }, [userId, timeRange])

  const fetchAnalyticsData = async () => {
    if (!supabase) return
    
    try {
      setLoading(true)
      setError(null)

      // Get basic metrics
      const { data: metrics, error: metricsError } = await supabase
        .rpc('calculate_user_matchmaking_metrics', {
          p_period: timeRange,
          p_user_id: userId
        })

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError)
        throw new Error('Failed to fetch metrics')
      }

      // Get compatibility trends
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
      const { data: trends, error: trendsError } = await supabase
        .rpc('get_compatibility_trends', {
          p_user_id: userId,
          p_days: days
        })

      if (trendsError) {
        console.error('Error fetching trends:', trendsError)
        throw new Error('Failed to fetch trends')
      }

      // Get top match factors
      const { data: factors, error: factorsError } = await supabase
        .from('matchmaking_interactions')
        .select('match_factors')
        .eq('user_id', userId)
        .not('match_factors', 'is', null)
        .limit(100)

      if (factorsError) {
        console.error('Error fetching factors:', factorsError)
      }

      // Process match factors
      const factorCounts: Record<string, number> = {}
      factors?.forEach(interaction => {
        if (interaction.match_factors) {
          Object.entries(interaction.match_factors).forEach(([key, value]) => {
            if (typeof value === 'boolean' && value) {
              factorCounts[key] = (factorCounts[key] || 0) + 1
            }
          })
        }
      })

      const totalFactors = Object.values(factorCounts).reduce((sum, count) => sum + count, 0)
      const topMatchFactors = Object.entries(factorCounts)
        .map(([factor, count]) => ({
          factor: factor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count,
          percentage: totalFactors > 0 ? Math.round((count / totalFactors) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const metricsData = metrics?.[0] || {
        avg_compatibility: 0,
        total_interactions: 0,
        applications_sent: 0,
        successful_matches: 0,
        engagement_score: 0
      }

      setAnalyticsData({
        avgCompatibility: metricsData.avg_compatibility || 0,
        totalInteractions: metricsData.total_interactions || 0,
        applicationsSent: metricsData.applications_sent || 0,
        successfulMatches: metricsData.successful_matches || 0,
        engagementScore: metricsData.engagement_score || 0,
        compatibilityTrends: trends || [],
        topMatchFactors
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 60) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 40) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-emerald-500" />
            <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <BarChart3 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchAnalyticsData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Analytics Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start using the matchmaking features to see your analytics here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const engagement = getEngagementLevel(analyticsData.engagementScore)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Matchmaking Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your performance over the last {timeRange}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {timeRange}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(analyticsData.avgCompatibility)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Compatibility</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.totalInteractions}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.applicationsSent}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Applications Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${engagement.bg}`}>
                <Award className={`w-6 h-6 ${engagement.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(analyticsData.engagementScore)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="factors">Match Factors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Compatibility Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.compatibilityTrends.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.compatibilityTrends.slice(0, 7).map((trend, index) => (
                    <div key={trend.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{new Date(trend.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {trend.total_calculations} calculations
                        </span>
                        <Badge variant="outline">
                          {Math.round(trend.avg_compatibility)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">No trend data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Top Match Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.topMatchFactors.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.topMatchFactors.map((factor, index) => (
                    <div key={factor.factor} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{factor.factor}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${factor.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {factor.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">No match factor data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analyticsData.applicationsSent > 0 
                      ? Math.round((analyticsData.successfulMatches / analyticsData.applicationsSent) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analyticsData.successfulMatches} successful out of {analyticsData.applicationsSent} applications
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Engagement Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge className={`${engagement.bg} ${engagement.color} text-lg px-4 py-2`}>
                    {engagement.level}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Based on your interaction patterns
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MatchmakingAnalytics
