'use client'

import { useRouter } from 'next/navigation'
import { UserProfile } from '../../lib/types/dashboard'

interface SmartSuggestionsCardProps {
  profile: UserProfile
}

export function SmartSuggestionsCard({ profile }: SmartSuggestionsCardProps) {
  const router = useRouter()

  const hasAnyContent = profile.years_experience || profile.specializations?.length ||
    (profile.hourly_rate_min && profile.hourly_rate_max) || profile.available_for_travel

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Smart Suggestions</h3>
          <p className="text-sm text-muted-foreground">Based on your experience and profile</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Experience-based suggestions */}
        {profile.years_experience && profile.years_experience >= 3 && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Premium Creator Status
                </p>
                <p className="text-xs text-primary/80 mt-1">
                  With {profile.years_experience} years of experience, consider applying for premium creator status to access higher-paying gigs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Specialization suggestions */}
        {profile.specializations && profile.specializations.length > 0 && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Specialization Opportunities
                </p>
                <p className="text-xs text-primary mt-1">
                  Your specializations in {profile.specializations.slice(0, 2).join(', ')} are in high demand. Consider creating targeted gigs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rate optimization suggestions */}
        {profile.hourly_rate_min && profile.hourly_rate_max && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Rate Optimization
                </p>
                <p className="text-xs text-primary mt-1">
                  Your rate range (€{profile.hourly_rate_min}-{profile.hourly_rate_max}/hour) is competitive. Consider adjusting based on project complexity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Travel availability suggestions */}
        {profile.available_for_travel && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Travel Opportunities
                </p>
                <p className="text-xs text-primary mt-1">
                  Your travel availability (up to {profile.travel_radius_km || 'unlimited'}km) opens up more gig opportunities. Highlight this in your profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Default suggestion for new users */}
        {!hasAnyContent && (
          <div className="p-4 bg-muted rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Complete Your Profile
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your experience, specializations, and rate information to get personalized suggestions and more gig opportunities.
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
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
