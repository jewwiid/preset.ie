'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UserProfile } from '../../lib/types/dashboard'
import { useSmartSuggestions } from '@/lib/hooks/dashboard/useSmartSuggestions'
import { getProfileCompletionSummary } from '@/lib/utils/smart-suggestions'
import { Button } from '@/components/ui/button'
import {
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Award,
  AlertCircle,
  Globe,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SmartSuggestionsCardProps {
  profile: UserProfile
}

export function SmartSuggestionsCard({ profile }: SmartSuggestionsCardProps) {
  const router = useRouter()
  const completionSummary = getProfileCompletionSummary(profile)
  console.log('🔍 SmartSuggestionsCard Profile:', {
    profileCompletion: profile.profile_completion_percentage,
    calculatedCompletion: completionSummary.current,
    accountType: profile.account_type,
    id: profile.id
  })
  const { topMatches, matchingInsights, nearbyGigs, deadlineGigs, loading } = useSmartSuggestions(profile)

  // Carousel state for cycling through matches
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  // Auto-rotate through matches
  useEffect(() => {
    if (topMatches.length <= 1) return

    const interval = setInterval(() => {
      setCurrentMatchIndex((prev) => (prev + 1) % topMatches.length)
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [topMatches.length])

  // Navigate to previous/next match
  const goToPreviousMatch = () => {
    setCurrentMatchIndex((prev) => (prev - 1 + topMatches.length) % topMatches.length)
  }

  const goToNextMatch = () => {
    setCurrentMatchIndex((prev) => (prev + 1) % topMatches.length)
  }

  const currentMatch = topMatches[currentMatchIndex]

  
  const hasAnyContent = profile.years_experience || profile.specializations?.length ||
    (profile.hourly_rate_min && profile.hourly_rate_max) || profile.available_for_travel

  // Show loading state
  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Smart Suggestions</h3>
            <p className="text-sm text-muted-foreground">Analyzing your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Smart Suggestions</h3>
          <p className="text-sm text-muted-foreground">Based on your profile, matches, and market data</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 🎯 Profile Completion Suggestion - HIGH PRIORITY */}
        {completionSummary.current < 100 && completionSummary.topMissingField && (
          <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="w-3 h-3 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-accent-foreground">
                  {completionSummary.current}% Profile Complete
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add {completionSummary.topMissingLabel} to reach{' '}
                  {completionSummary.current + completionSummary.topMissingField.weight}%
                  {' '}and boost your visibility
                  {topMatches.length > 0 && ` (${topMatches.length} gig${topMatches.length > 1 ? 's' : ''} match your profile)`}
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="mt-2 text-xs text-accent-foreground hover:text-foreground font-medium transition-colors"
                >
                  Add {completionSummary.topMissingLabel} (+{completionSummary.topMissingField.weight} points) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ⏰ Deadline Alerts - URGENT */}
        {deadlineGigs.length > 0 && (
          <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3 h-3 text-destructive-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive-foreground">
                  ⏰ {deadlineGigs.length} Deadline{deadlineGigs.length > 1 ? 's' : ''} Approaching!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  "{deadlineGigs[0].title}" in {deadlineGigs[0].city} ({Math.round(deadlineGigs[0].compatibility_score)}% match) closes soon
                  {deadlineGigs.length > 1 && ` and ${deadlineGigs.length - 1} more`}
                </p>
                <button
                  onClick={() => router.push('/gigs/discover')}
                  className="mt-2 text-xs text-destructive-foreground hover:text-foreground font-medium transition-colors"
                >
                  Apply Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✨ Top Gig Matches */}
        {topMatches.length > 0 && deadlineGigs.length === 0 && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary">
                    {topMatches.length} Perfect Match{topMatches.length > 1 ? 'es' : ''} Found!
                  </p>
                  {topMatches.length > 1 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Button
                        onClick={goToPreviousMatch}
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 text-primary-foreground bg-primary hover:bg-primary/90 border-primary hover:border-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:border-muted"
                        disabled={loading}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-md min-w-[3rem]">
                        {currentMatchIndex + 1}/{topMatches.length}
                      </span>
                      <Button
                        onClick={goToNextMatch}
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0 text-primary-foreground bg-primary hover:bg-primary/90 border-primary hover:border-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:border-muted"
                        disabled={loading}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  "{currentMatch.title}" in {currentMatch.city} is a{' '}
                  {Math.round(currentMatch.compatibility_score)}% match
                  {currentMatch.application_deadline &&
                    `. Apply before ${new Date(currentMatch.application_deadline).toLocaleDateString()}`}
                </p>
                <Button
                  onClick={() => router.push(`/gigs/${currentMatch.id}`)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  View Gig →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 📈 Improve Match Score */}
        {matchingInsights && matchingInsights.improvements.length > 0 && (
          <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUp className="w-3 h-3 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-accent-foreground">
                  Unlock More Matches
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {matchingInsights.topImprovement?.action} to improve your match score
                  {matchingInsights.topImprovement?.gigCount && 
                    ` for ${matchingInsights.topImprovement.gigCount} gig${matchingInsights.topImprovement.gigCount > 1 ? 's' : ''}`}
                </p>
                {matchingInsights.improvements.slice(0, 3).length > 1 && (
                  <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                    {matchingInsights.improvements.slice(0, 3).map((imp) => (
                      <li key={imp.field}>• {imp.message}</li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => router.push('/profile')}
                  className="mt-2 text-xs text-accent-foreground hover:text-foreground font-medium transition-colors"
                >
                  {matchingInsights.topImprovement?.action} →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🌍 Nearby Opportunities */}
        {nearbyGigs.length > 0 && profile.available_for_travel && (
          <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-3 h-3 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary-foreground">
                  Nearby Opportunities
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {nearbyGigs[0].city} has {nearbyGigs[0].gigCount} gig{nearbyGigs[0].gigCount > 1 ? 's' : ''} matching your profile
                  {nearbyGigs.length > 1 && ` and ${nearbyGigs.length - 1} more cit${nearbyGigs.length - 1 > 1 ? 'ies' : 'y'}`}
                </p>
                <button
                  onClick={() => router.push('/gigs/discover')}
                  className="mt-2 text-xs text-secondary-foreground hover:text-foreground font-medium transition-colors"
                >
                  Explore Nearby →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Experience-based suggestions */}
        {profile.years_experience && profile.years_experience >= 3 && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Award className="w-3 h-3 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Premium Creator Status
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  With {profile.years_experience} years of experience, consider applying for premium creator status to access higher-paying gigs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Specialization suggestions */}
        {profile.specializations && profile.specializations.length > 0 && (
          <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Briefcase className="w-3 h-3 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-accent-foreground">
                  Specialization Opportunities
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your specializations in {profile.specializations.slice(0, 2).join(', ')} are in high demand. Consider creating targeted gigs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rate optimization suggestions */}
        {profile.hourly_rate_min && profile.hourly_rate_max && (
          <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <DollarSign className="w-3 h-3 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary-foreground">
                  Rate Optimization
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your rate range (€{profile.hourly_rate_min}-{profile.hourly_rate_max}/hour) is competitive. Consider adjusting based on project complexity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Travel availability suggestions */}
        {profile.available_for_travel && nearbyGigs.length === 0 && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Globe className="w-3 h-3 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Travel Opportunities
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your travel availability (up to {profile.travel_radius_km || 'unlimited'}km) opens up more gig opportunities. Highlight this in your profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Default suggestion for new users */}
        {!hasAnyContent && completionSummary.current < 50 && (
          <div className="p-4 bg-muted rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-muted-foreground/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Complete Your Profile
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completionSummary.message}
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="mt-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Complete Profile →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
