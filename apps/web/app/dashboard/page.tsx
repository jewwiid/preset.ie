'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { useDashboardData } from '../../lib/hooks/dashboard/useDashboardData'
import { usePendingInvitations } from '../../lib/hooks/dashboard/usePendingInvitations'
import { useGigInvitations } from '../../lib/hooks/dashboard/useGigInvitations'
import { ProfileCard } from '../../components/dashboard/ProfileCard'
import { RecentGigsCard } from '../../components/dashboard/RecentGigsCard'
import { RecentMessagesCard } from '../../components/dashboard/RecentMessagesCard'
import { SmartSuggestionsCard } from '../../components/dashboard/SmartSuggestionsCard'
import { PendingInvitationsCard } from '../../components/dashboard/PendingInvitationsCard'
import { PendingGigInvitationsCard } from '../../components/dashboard/PendingGigInvitationsCard'
import { AllInvitationsCard } from '../../components/dashboard/AllInvitationsCard'
import { DashboardMatchmakingCard } from '../../components/dashboard/DashboardMatchmakingCard'
import { UserReferralCard } from '../../components/dashboard/UserReferralCard'
// import { PendingShowcaseApprovals } from '../../components/dashboard/PendingShowcaseApprovals'
import SavedMediaGallery from '../components/playground/SavedImagesGallery'
import { BannerPosition } from '../../lib/types/dashboard'
import { LoadingSpinner } from '../../components/ui/loading-spinner'
import { Button } from '../../components/ui/button'

export default function Dashboard() {
  const router = useRouter()
  const { user, userRole, loading: authLoading, signOut } = useAuth()
  const {
    profile,
    loading,
    recentGigs,
    stats,
    credits,
    recentMessages,
    messagesLoading,
    matchmakingData,
    matchmakingLoading,
    isTalent,
    isContributor
  } = useDashboardData()

  const {
    invitations,
    loading: invitationsLoading,
    acceptInvitation,
    declineInvitation
  } = usePendingInvitations()

  const {
    invitations: gigInvitations,
    loading: gigInvitationsLoading,
    acceptInvitation: acceptGigInvitation,
    declineInvitation: declineGigInvitation
  } = useGigInvitations()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <LoadingSpinner size="xl" fullScreen />
    )
  }

  if (!user || !profile) {
    return null
  }

  const isAdmin = userRole?.isAdmin

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden pb-64">
        {/* Custom Banner Background */}
        {profile.header_banner_url ? (
          <div className="absolute inset-0 overflow-hidden bg-muted">
            <img
              src={profile.header_banner_url}
              alt="Header banner"
              className="w-full h-full object-cover transition-transform duration-300"
              style={(() => {
                try {
                  const position: BannerPosition = profile.header_banner_position
                    ? JSON.parse(profile.header_banner_position)
                    : { y: 0, scale: 1.2 }
                  return {
                    transform: `translateY(${position.y}px) scale(${position.scale})`,
                    transformOrigin: 'center center'
                  }
                } catch {
                  return 
                }
              })()}
            />
            <div className="absolute inset-0 bg-foreground/40"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-background">
            <div className="absolute inset-0 bg-background"></div>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:justify-between lg:items-start">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 lg:order-2">
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-muted hover:bg-accent text-foreground px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-border transition-all flex-shrink-0"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => router.push('/profile')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0"
              >
                Profile Settings
              </button>
              <button
                onClick={handleSignOut}
                className="bg-muted hover:bg-accent text-foreground px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-border transition-all flex-shrink-0"
              >
                Sign Out
              </button>
            </div>

            {/* Welcome Message */}
            <div className="text-primary-foreground lg:order-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                Welcome back, {isAdmin ? 'Admin' : profile.display_name}!
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative -mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

          {/* Profile & Recent Gigs - 2 Column Layout */}
          <div className="mb-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileCard
                profile={profile}
                credits={credits}
                isTalent={!!isTalent}
                isContributor={!!isContributor}
              />
              <RecentGigsCard
                gigs={recentGigs}
                isContributor={!!isContributor}
              />
            </div>
          </div>

          {/* Recent Messages and Smart Suggestions - 2 Column Layout */}
          <div className="mb-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentMessagesCard
                messages={recentMessages}
                loading={messagesLoading}
              />
              <SmartSuggestionsCard profile={profile} />
            </div>
          </div>

          {/* Referral Card - Full Width */}
          <div className="mb-6 max-w-7xl mx-auto">
            <UserReferralCard
              userRole={{
                isTalent: !!isTalent,
                isContributor: !!isContributor,
                isAdmin: !!isAdmin
              }}
              userName={profile.display_name}
            />
          </div>

          {/* All Invitations Quick Access Card */}
          <div className="mb-6 max-w-7xl mx-auto">
            <AllInvitationsCard
              gigInvitationsCount={gigInvitations.length}
              collabInvitationsCount={invitations.length}
              loading={invitationsLoading || gigInvitationsLoading}
            />
          </div>

          {/* Pending Invitations Section */}
          <PendingInvitationsCard
            invitations={invitations}
            loading={invitationsLoading}
            onAccept={acceptInvitation}
            onDecline={declineInvitation}
          />

          {/* Pending Gig Invitations Section - For Talent Users */}
          {isTalent && (
            <PendingGigInvitationsCard
              invitations={gigInvitations}
              loading={gigInvitationsLoading}
              onAccept={acceptGigInvitation}
              onDecline={declineGigInvitation}
            />
          )}

          {/* Smart Matchmaking Section - For Talent Users */}
          {isTalent && (
            <DashboardMatchmakingCard
              matchmakingData={matchmakingData}
              loading={matchmakingLoading}
            />
          )}

          {/* Pending Showcase Approvals - Temporarily disabled */}
          {/* <PendingShowcaseApprovals /> */}

          {/* Saved Images Gallery */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-xl mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">My Saved Images</h3>
                  <p className="text-sm text-muted-foreground">Images saved from the playground for use in moodboards, showcases, and profiles</p>
                </div>
              </div>
              <Button 
                variant="link" 
                onClick={() => router.push('/playground')}
                className="text-sm font-medium"
              >
                Generate More →
              </Button>
            </div>

            <SavedMediaGallery
              onMediaSelect={(media) => {
                console.log('Selected media for use:', media)
              }}
            />
          </div>

          {/* Stats Overview - Clickable Navigation Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => router.push(isContributor ? '/gigs/my-gigs' : '/gigs')}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary transition-all hover:scale-105 hover:shadow-lg group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Gigs</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalGigs}</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/applications/my-applications')}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary transition-all hover:scale-105 hover:shadow-lg group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applications</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalApplications}</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/showcases')}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary transition-all hover:scale-105 hover:shadow-lg group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Showcases</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalShowcases}</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/messages')}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary transition-all hover:scale-105 hover:shadow-lg group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Messages</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalMessages}</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          {/* Talent Actions */}
          {isTalent && (
            <div className="bg-card rounded-2xl p-8 border border-border shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground">Talent Actions</h3>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/gigs')}
                  className="group relative overflow-hidden bg-primary text-primary-foreground px-6 py-4 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-lg w-full"
                >
                  <span className="relative z-10">Browse Gigs</span>
                  <div className="absolute inset-0 bg-primary/90 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push('/applications/my-applications')}
                    className="bg-muted hover:bg-muted/80 text-foreground px-6 py-4 rounded-xl font-medium transition-all hover:scale-105"
                  >
                    My Applications
                  </button>
                  <button
                    onClick={() => router.push('/showcases')}
                    className="bg-muted hover:bg-muted/80 text-foreground px-6 py-4 rounded-xl font-medium transition-all hover:scale-105"
                  >
                    Showcases
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
