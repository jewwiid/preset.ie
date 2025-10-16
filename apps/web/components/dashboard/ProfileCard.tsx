'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UserProfile, CreditsData } from '../../lib/types/dashboard'
import { calculateCreditValue } from '../../lib/utils/dashboard'
import { getProfileCompletionSummary } from '../../lib/utils/smart-suggestions'
import { VerificationBadges } from '../VerificationBadges'
import { parseVerificationBadges } from '../../lib/utils/verification-badges'
import { supabase } from '../../lib/supabase'

interface ProfileCardProps {
  profile: UserProfile
  credits: CreditsData
  isTalent: boolean
  isContributor: boolean
}

export function ProfileCard({ profile, credits, isTalent, isContributor }: ProfileCardProps) {
  const router = useRouter()
  const completionSummary = getProfileCompletionSummary(profile)
  console.log('🔍 ProfileCard Profile:', {
    profileCompletion: profile.profile_completion_percentage,
    calculatedCompletion: completionSummary.current,
    accountType: profile.account_type,
    id: profile.id
  })
  const [pendingVerifications, setPendingVerifications] = useState<string[]>([])
  const [loadingVerificationStatus, setLoadingVerificationStatus] = useState(true)

  // Parse verification badges
  const verificationBadges = parseVerificationBadges(profile.verification_badges || null)

  // Check for pending verification requests
  useEffect(() => {
    const checkPendingVerifications = async () => {
      if (!supabase) return
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch pending verification requests
        const { data: requests } = await supabase
          .from('verification_requests')
          .select('verification_type')
          .eq('user_id', user.id)
          .in('status', ['pending', 'reviewing'])

        if (requests) {
          setPendingVerifications(requests.map(r => r.verification_type))
        }
      } catch (error) {
        console.error('Error checking verification status:', error)
      } finally {
        setLoadingVerificationStatus(false)
      }
    }

    checkPendingVerifications()
  }, [])

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      {/* Profile Header with Avatar Integration */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-border shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center border-2 border-primary/20 shadow-lg">
                <span className="text-primary-foreground font-bold text-xl">
                  {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary border-2 border-background rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-background rounded-full"></div>
            </div>
          </div>

          {/* User Info & Role */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-foreground">{profile.display_name}</h3>
              <VerificationBadges
                verifiedIdentity={verificationBadges.identity}
                verifiedProfessional={verificationBadges.professional}
                verifiedBusiness={verificationBadges.business}
                size="md"
              />
              <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full uppercase tracking-wide">
                {profile.subscription_tier}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">@{profile.handle}</span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm font-medium">
                  {isContributor && isTalent ? 'Contributor & Talent' :
                   isContributor ? 'Contributor' : 'Talent'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credits & Balance Row - Enhanced Mobile Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => router.push('/credits/purchase')}
          className="bg-primary/5 rounded-xl p-3 sm:p-4 border border-primary/20 hover:bg-primary/10 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary text-xs sm:text-sm font-medium mb-1 truncate">Available Credits</p>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <p className="text-foreground text-lg sm:text-2xl font-bold">{credits.current_balance}</p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  of {credits.monthly_allowance || 'unlimited'}
                </p>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/credits/purchase')}
          className="bg-primary/5 rounded-xl p-3 sm:p-4 border border-primary/20 hover:bg-primary/10 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary text-xs sm:text-sm font-medium mb-1 truncate">Account Balance</p>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <p className="text-foreground text-lg sm:text-2xl font-bold">€{calculateCreditValue(credits.current_balance).toFixed(2)}</p>
                <p className="text-muted-foreground text-xs sm:text-sm">EUR</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Profile Completion */}
      <div className="mt-4 p-4 bg-muted rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Profile Completion</p>
          <p className="text-sm font-bold text-primary">{completionSummary.current}%</p>
        </div>
        <div className="w-full bg-background rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionSummary.current}%` }}
          ></div>
        </div>
        {completionSummary.current < 100 && (
          <button
            onClick={() => router.push('/profile')}
            className="mt-3 w-full text-center text-xs text-primary hover:text-primary/80 font-medium"
          >
            Complete your profile to increase visibility →
          </button>
        )}
      </div>

      {/* Verification Status - Show appropriate status */}
      {!loadingVerificationStatus && (
        <>
          {/* Show pending verification status */}
          {pendingVerifications.length > 0 ? (
            <div className="mt-4 w-full p-4 bg-accent/5 rounded-xl border border-accent/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-accent-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-accent-foreground">
                    Verification Under Review
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your {pendingVerifications.join(', ')} verification is being reviewed. You'll be notified once processed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Show Get Verified CTA only if no verifications and no pending requests */
            !verificationBadges.identity && !verificationBadges.professional && !verificationBadges.business && (
              <button
                onClick={() => router.push('/verify')}
                className="mt-4 w-full p-4 bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">Get Verified</p>
                    <p className="text-xs text-muted-foreground">Build trust and stand out with a verified badge</p>
                  </div>
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          )}
        </>
      )}
    </div>
  )
}
