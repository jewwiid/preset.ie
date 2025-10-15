'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RefreshCw, Filter, Star, TrendingUp, Users, MapPin, ArrowLeft, Heart } from 'lucide-react'
import { MatchmakingProvider, useMatchmaking } from '../components/matchmaking/context/MatchmakingContext'
import { useAuth } from '../../lib/auth-context'
import { PageHeader } from '@/components/PageHeader'
import { usePageHeaderImage } from '@/hooks/usePageHeaderImage'
import Link from 'next/link'
import MatchmakingCard from '../components/matchmaking/MatchmakingCard'
import CompatibilityScore from '../components/matchmaking/CompatibilityScore'
import MatchmakingFilters from '../components/matchmaking/MatchmakingFilters'
import RecommendationEngine from '../components/matchmaking/RecommendationEngine'
import MatchmakingAnalytics from '../components/matchmaking/MatchmakingAnalytics'
import AdvancedSearch from '../components/matchmaking/AdvancedSearch'
import { Recommendation } from '../../lib/types/matchmaking'

const MatchmakingDashboardContent: React.FC = () => {
  const { user } = useAuth()
  const {
    recommendations,
    loading,
    filters,
    fetchRecommendations,
    refreshRecommendations,
    updateFilters
  } = useMatchmaking()

  const [activeTab, setActiveTab] = useState('recommended')
  const [userType, setUserType] = useState<'talent' | 'contributor'>('talent')
  const [searchResults, setSearchResults] = useState<Recommendation[]>([])

  // Get header image
  const { headerImage } = usePageHeaderImage('matchmaking')

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const handleRefresh = async () => {
    await refreshRecommendations()
  }

  const handleViewDetails = (recommendation: Recommendation) => {
    // Navigate to gig detail page
    if (recommendation.type === 'gig') {
      window.open(`/gigs/${recommendation.id}`, '_blank')
    }
  }

  const handleApply = (recommendation: Recommendation) => {
    // Navigate to gig application page
    if (recommendation.type === 'gig') {
      window.open(`/gigs/${recommendation.id}`, '_blank')
    }
  }

  // Group recommendations by priority for stats
  const highPriorityRecommendations = recommendations.filtered.filter(r => r.priority === 'high')
  const mediumPriorityRecommendations = recommendations.filtered.filter(r => r.priority === 'medium')
  const lowPriorityRecommendations = recommendations.filtered.filter(r => r.priority === 'low')

  return (
    <div className="min-h-screen bg-muted-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <PageHeader
          title="Matchmaking"
          subtitle="Discover gigs that match your profile and preferences"
          icon={Heart}
          stats={[
            { icon: Star, label: `${highPriorityRecommendations.length} Perfect Matches` },
            { icon: TrendingUp, label: `${mediumPriorityRecommendations.length} Good Matches` },
            { icon: Users, label: `${recommendations.filtered.length} Total Opportunities` }
          ]}
          actions={
            <>
              <Link href="/gigs">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Gigs
                </Button>
              </Link>
              <MatchmakingFilters
                onFiltersChange={updateFilters}
                userType={userType}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          }
          backgroundImage={headerImage}
        />

        {/* Quick Stats Summary */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">
                      {recommendations.filtered.length > 0 ? Math.round(recommendations.filtered.reduce((acc, r) => acc + r.compatibility_score, 0) / recommendations.filtered.length) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground-600">Average Compatibility</p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground-500">
                  {userType === 'talent' ? 'Finding gigs perfect for your talent profile' : 'Discovering talent for your projects'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="search">Advanced Search</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="saved">Saved Searches</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="space-y-6">
            <RecommendationEngine
              userType={userType}
              recommendations={recommendations}
              onRecommendationClick={handleViewDetails}
              onRefresh={handleRefresh}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <AdvancedSearch
              userType={userType}
              onSearch={(results) => setSearchResults(results)}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <MatchmakingAnalytics
              userId={user?.id || ''}
              timeRange="month"
            />
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your saved searches will appear here. Use the Advanced Search tab to create and save new searches.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}

const MatchmakingDashboard: React.FC = () => {
  return (
    <MatchmakingProvider>
      <MatchmakingDashboardContent />
    </MatchmakingProvider>
  )
}

export default MatchmakingDashboard
