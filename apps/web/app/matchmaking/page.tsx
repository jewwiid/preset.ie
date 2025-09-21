'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { RefreshCw, Filter, Star, TrendingUp, Users, MapPin } from 'lucide-react'
import { MatchmakingProvider, useMatchmaking } from '../components/matchmaking/context/MatchmakingContext'
import { useAuth } from '../../lib/auth-context'
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

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const handleRefresh = async () => {
    await refreshRecommendations()
  }

  const handleViewDetails = (recommendation: Recommendation) => {
    // Navigate to gig detail page or open modal
    console.log('View details for:', recommendation.id)
  }

  const handleApply = (recommendation: Recommendation) => {
    // Handle application logic
    console.log('Apply to:', recommendation.id)
  }

  // Group recommendations by priority for stats
  const highPriorityRecommendations = recommendations.filter(r => r.priority === 'high')
  const mediumPriorityRecommendations = recommendations.filter(r => r.priority === 'medium')
  const lowPriorityRecommendations = recommendations.filter(r => r.priority === 'low')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Matchmaking</h1>
              <p className="text-gray-600 mt-2">
                Discover gigs that match your profile and preferences
              </p>
            </div>
            
            <div className="flex items-center gap-3">
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
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Star className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{highPriorityRecommendations.length}</p>
                  <p className="text-sm text-gray-600">Perfect Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{mediumPriorityRecommendations.length}</p>
                  <p className="text-sm text-gray-600">Good Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
                  <p className="text-sm text-gray-600">Total Opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {recommendations.length > 0 ? Math.round(recommendations.reduce((acc, r) => acc + r.compatibility_score, 0) / recommendations.length) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Avg Compatibility</p>
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
                <p className="text-gray-600 dark:text-gray-400">
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
