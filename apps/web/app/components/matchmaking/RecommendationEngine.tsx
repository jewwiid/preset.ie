'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Star,
  TrendingUp,
  Users,
  MapPin,
  RefreshCw,
  Target,
  Heart,
  Bookmark,
  BookmarkCheck,
  Info
} from 'lucide-react'
import { useSavedGigs } from '../../gigs/hooks/useSavedGigs'
import MatchmakingCard from './MatchmakingCard'
import CompatibilityScore from './CompatibilityScore'
import { Recommendation, MatchmakingFilters } from '../../../lib/types/matchmaking'

interface RecommendationEngineProps {
  userType: 'talent' | 'contributor'
  recommendations: {
    all: Recommendation[]
    filtered: Recommendation[]
  }
  onRecommendationClick: (recommendation: Recommendation) => void
  onRefresh?: () => void
  loading?: boolean
  className?: string
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  userType,
  recommendations,
  onRecommendationClick,
  onRefresh,
  loading = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('recommended')
  const { savedGigs, toggleSaveGig } = useSavedGigs()

  // Use filtered recommendations for most tabs
  const filteredRecommendations = recommendations.filtered
  const allRecommendations = recommendations.all

  // Group recommendations by priority
  const highPriorityRecommendations = filteredRecommendations.filter(r => r.priority === 'high')
  const mediumPriorityRecommendations = filteredRecommendations.filter(r => r.priority === 'medium')
  const lowPriorityRecommendations = filteredRecommendations.filter(r => r.priority === 'low')

  // Calculate average compatibility
  const averageCompatibility = filteredRecommendations.length > 0
    ? Math.round(filteredRecommendations.reduce((sum, r) => sum + r.compatibility_score, 0) / filteredRecommendations.length)
    : 0

  // Tab-specific stats
  const tabStats = {
    recommended: {
      high: highPriorityRecommendations.length,
      medium: mediumPriorityRecommendations.length,
      low: lowPriorityRecommendations.length,
      total: filteredRecommendations.length,
      avgCompatibility: averageCompatibility
    },
    all: {
      high: allRecommendations.filter(r => r.priority === 'high').length,
      medium: allRecommendations.filter(r => r.priority === 'medium').length,
      low: allRecommendations.filter(r => r.priority === 'low').length,
      total: allRecommendations.length,
      avgCompatibility: allRecommendations.length > 0
        ? Math.round(allRecommendations.reduce((sum, r) => sum + r.compatibility_score, 0) / allRecommendations.length)
        : 0
    }
  }

  const handleSaveGig = (recommendationId: string) => {
    toggleSaveGig(recommendationId)
  }

  const RecommendationSection: React.FC<{ 
    title: string
    recommendations: Recommendation[]
    icon: React.ReactNode
    badgeColor: string
    description?: string
  }> = ({ title, recommendations, icon, badgeColor, description }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground-900 dark:text-primary-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground-500 dark:text-muted-foreground-400">{description}</p>
            )}
          </div>
          <Badge variant="outline" className={badgeColor}>
            {recommendations.length}
          </Badge>
        </div>
        
        {recommendations.length > 0 && (
          <div className="flex items-center gap-2">
            <CompatibilityScore 
              score={Math.round(recommendations.reduce((sum, r) => sum + r.compatibility_score, 0) / recommendations.length)}
              size="sm"
            />
          </div>
        )}
      </div>
      
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="relative">
              <MatchmakingCard
                type={recommendation.type}
                data={recommendation.data}
                compatibilityScore={recommendation.compatibility_score}
                compatibilityBreakdown={recommendation.compatibility_breakdown}
                onViewDetails={() => onRecommendationClick(recommendation)}
                onApply={() => onRecommendationClick(recommendation)}
              />
              
              {/* Save/Like Button - Only for gig recommendations */}
              {recommendation.type === 'gig' && (
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-6 w-6 p-0 ${
                      savedGigs.has(recommendation.id)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-muted-foreground-400 hover:text-primary-600'
                    }`}
                    onClick={() => handleSaveGig(recommendation.id)}
                    title={savedGigs.has(recommendation.id) ? 'Remove from saved' : 'Save gig'}
                  >
                    {savedGigs.has(recommendation.id) ? (
                      <BookmarkCheck className="w-3 h-3" />
                    ) : (
                      <Bookmark className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground-500 dark:text-muted-foreground-400">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground-300 dark:text-muted-foreground-600" />
            <p>No {title.toLowerCase()} found</p>
            <p className="text-sm">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const AlgorithmExplanation: React.FC = () => (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary-600" />
          <CardTitle className="text-lg text-primary-900 dark:text-primary-100">
            How Our Algorithm Works
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-primary-800 dark:text-primary-200">
          <p className="mb-2">Our matchmaking algorithm considers multiple factors:</p>
          <ul className="space-y-1 ml-4">
            <li>• <strong>Demographics:</strong> Age, gender, location compatibility</li>
            <li>• <strong>Experience:</strong> Years of experience and skill level</li>
            <li>• <strong>Specializations:</strong> Matching skills and expertise</li>
            <li>• <strong>Preferences:</strong> Work style, availability, and compensation</li>
            <li>• <strong>History:</strong> Past successful collaborations</li>
          </ul>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-300">
          <Target className="w-3 h-3" />
          <span>Higher scores indicate better compatibility</span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={className}>
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
              {userType === 'talent' ? 'Recommended Gigs' : 'Recommended Talent'}
            </h2>
            <p className="text-muted-foreground">
              Personalized recommendations based on your profile
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Star className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                    {activeTab === 'all' ? tabStats.all.high : tabStats.recommended.high}
                  </p>
                  <p className="text-sm text-muted-foreground">Perfect Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                    {activeTab === 'all' ? tabStats.all.medium : tabStats.recommended.medium}
                  </p>
                  <p className="text-sm text-muted-foreground">Good Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                    {activeTab === 'all' ? tabStats.all.total : tabStats.recommended.total}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-muted-foreground-900 dark:text-primary-foreground">
                    {activeTab === 'all' ? tabStats.all.avgCompatibility : tabStats.recommended.avgCompatibility}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Compatibility</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Algorithm Explanation */}
      <AlgorithmExplanation />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="perfect">Perfect Matches</TabsTrigger>
          <TabsTrigger value="all">All Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-6 mt-6">
          <RecommendationSection
            title="Recommended for You"
            recommendations={filteredRecommendations.slice(0, 6)}
            icon={<Star className="w-5 h-5 text-primary-500" />}
            badgeColor="bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
            description="Top recommendations based on your profile and preferences"
          />
        </TabsContent>

        <TabsContent value="perfect" className="space-y-6 mt-6">
          <RecommendationSection
            title="Perfect Matches"
            recommendations={highPriorityRecommendations}
            icon={<Star className="w-5 h-5 text-primary-500" />}
            badgeColor="bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
            description="High compatibility matches (90%+ score)"
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-6 mt-6">
          <RecommendationSection
            title="All Opportunities"
            recommendations={recommendations.all}
            icon={<Users className="w-5 h-5 text-primary-500" />}
            badgeColor="bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
            description="Complete list of available opportunities"
          />
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-500" />
            <p className="text-muted-foreground">Finding your perfect matches...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && recommendations.filtered.length === 0 && (
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-6 text-muted-foreground-300 dark:text-muted-foreground-600" />
            <h3 className="text-xl font-semibold text-muted-foreground-900 dark:text-primary-foreground mb-2">
              No matches found
            </h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any {userType === 'talent' ? 'gigs' : 'talent'} that match your profile right now.
            </p>
            <div className="space-x-4">
              {onRefresh && (
                <Button onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button variant="outline">
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RecommendationEngine
