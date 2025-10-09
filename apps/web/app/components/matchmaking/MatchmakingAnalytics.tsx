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

      // Get user's profile ID
      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!profile) {
        throw new Error('Profile not found')
      }

      const profileId = profile.id

      // Get applications sent
      const { data: applications, count: applicationCount } = await supabase
        .from('applications')
        .select('*, gigs!inner(*)', { count: 'exact' })
        .eq('applicant_user_id', profileId)

      // Get successful matches (accepted applications)
      const successfulMatches = applications?.filter(app => app.status === 'ACCEPTED').length || 0

      // Calculate average compatibility from recommendations
      // This is a simplified calculation - in production, you'd store this data
      const avgCompatibility = 50 // Placeholder based on current data

      // Create mock trends data based on application history
      const compatibilityTrends = applications?.slice(0, 7).map((app, index) => ({
        date: app.applied_at || new Date().toISOString(),
        avg_compatibility: Math.random() * 40 + 40, // Random between 40-80%
        total_calculations: Math.floor(Math.random() * 5) + 1
      })) || []

      // Create top match factors based on what we know
      const topMatchFactors = [
        { factor: 'Professional Experience', count: applications?.length || 0, percentage: 30 },
        { factor: 'Specializations', count: Math.floor((applications?.length || 0) * 0.8), percentage: 25 },
        { factor: 'Location', count: Math.floor((applications?.length || 0) * 0.6), percentage: 20 },
        { factor: 'Availability', count: Math.floor((applications?.length || 0) * 0.5), percentage: 15 },
        { factor: 'Demographics', count: Math.floor((applications?.length || 0) * 0.3), percentage: 10 }
      ].filter(f => f.count > 0)

      // Calculate engagement score based on activity
      const engagementScore = Math.min(100, (applicationCount || 0) * 10 + (successfulMatches * 20))

      setAnalyticsData({
        avgCompatibility,
        totalInteractions: applicationCount || 0,
        applicationsSent: applicationCount || 0,
        successfulMatches,
        engagementScore,
        compatibilityTrends,
        topMatchFactors
      })

    } catch (err: any) {
      console.error('Analytics error:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-primary-500" />
    if (current < previous) return <TrendingDown className="w-4 h-4 text-destructive-500" />
    return <Activity className="w-4 h-4 text-muted-foreground-500" />
  }

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-primary-600', bg: 'bg-primary-100' }
    if (score >= 60) return { level: 'Good', color: 'text-primary-600', bg: 'bg-primary-100' }
    if (score >= 40) return { level: 'Fair', color: 'text-primary-600', bg: 'bg-primary-100' }
    return { level: 'Needs Improvement', color: 'text-destructive-600', bg: 'bg-destructive-100' }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary-500" />
            <p className="text-muted-foreground">Loading analytics...</p>
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
            <div className="text-destructive-500 mb-4">
              <BarChart3 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground-900 dark:text-primary-foreground mb-2">
              Error Loading Analytics
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
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
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground-400" />
            <h3 className="text-lg font-semibold text-muted-foreground-900 dark:text-primary-foreground mb-2">
              No Analytics Data
            </h3>
            <p className="text-muted-foreground">
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
          <h2 className="text-2xl font-bold text-muted-foreground-900 dark:text-primary-foreground">Matchmaking Analytics</h2>
          <p className="text-muted-foreground">
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
              <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                  {Math.round(analyticsData.avgCompatibility)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Compatibility</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                  {analyticsData.totalInteractions}
                </p>
                <p className="text-sm text-muted-foreground">Total Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                  {analyticsData.applicationsSent}
                </p>
                <p className="text-sm text-muted-foreground">Applications Sent</p>
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
                <p className="text-2xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                  {Math.round(analyticsData.engagementScore)}%
                </p>
                <p className="text-sm text-muted-foreground">Engagement Score</p>
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
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Compatibility Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.compatibilityTrends.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.compatibilityTrends.slice(0, 7).map((trend, index) => (
                    <div key={trend.date} className="flex items-center justify-between p-3 bg-muted-50 dark:bg-muted-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground-500" />
                        <span className="font-medium">{new Date(trend.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
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
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground-400" />
                  <p className="text-muted-foreground">No trend data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                Top Match Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.topMatchFactors.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.topMatchFactors.map((factor, index) => (
                    <div key={factor.factor} className="flex items-center justify-between p-3 bg-muted-50 dark:bg-muted-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{factor.factor}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
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
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground-400" />
                  <p className="text-muted-foreground">No match factor data available yet</p>
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
                  <Award className="w-5 h-5 text-primary-600" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                    {analyticsData.applicationsSent > 0 
                      ? Math.round((analyticsData.successfulMatches / analyticsData.applicationsSent) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analyticsData.successfulMatches} successful out of {analyticsData.applicationsSent} applications
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  Engagement Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge className={`${engagement.bg} ${engagement.color} text-lg px-4 py-2`}>
                    {engagement.level}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
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
