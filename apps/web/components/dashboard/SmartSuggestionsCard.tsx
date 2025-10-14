'use client'

import { useRouter } from 'next/navigation'
import { UserProfile } from '../../lib/types/dashboard'
import { getProfileCompletionSummary, calculatePotentialWithField } from '@/lib/utils/smart-suggestions'
import { useSmartSuggestions } from '@/lib/hooks/dashboard/useSmartSuggestions'
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
  Briefcase
} from 'lucide-react'

interface SmartSuggestionsCardProps {
  profile: UserProfile
}

export function SmartSuggestionsCard({ profile }: SmartSuggestionsCardProps) {
  const router = useRouter()
  const completionSummary = getProfileCompletionSummary(profile)
  const { topMatches, matchingInsights, nearbyGigs, deadlineGigs, loading } = useSmartSuggestions(profile)

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
                  {calculatePotentialWithField(profile, completionSummary.topMissingField.key)}%
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
                <p className="text-sm font-medium text-primary">
                  {topMatches.length} Perfect Match{topMatches.length > 1 ? 'es' : ''} Found!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  "{topMatches[0].title}" in {topMatches[0].city} is a{' '}
                  {Math.round(topMatches[0].compatibility_score)}% match
                  {topMatches[0].application_deadline && 
                    `. Apply before ${new Date(topMatches[0].application_deadline).toLocaleDateString()}`}
                </p>
                <button
                  onClick={() => router.push(`/gigs/${topMatches[0].id}`)}
                  className="mt-2 text-xs text-primary hover:text-foreground font-medium transition-colors"
                >
                  View Gig →
                </button>
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
