'use client'

import React, { Suspense } from 'react'
import { ProfileProvider, useProfileUI } from '../context/ProfileContext'
import { ProfileTabs } from './ProfileTabs'
import { ProfileHeaderEnhanced } from './ProfileHeaderEnhanced'
import { ProfileContent } from '../sections/ProfileContent'
import { SettingsPanel } from '../sections/SettingsPanel'
import { NotificationsPanel } from '../sections/NotificationsPanel'
import CreditsDashboard from '../CreditsDashboard'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfileLayoutProps {
  children: React.ReactNode
}

function ProfileLayoutContent({ children }: ProfileLayoutProps) {
  const router = useRouter()
  const { loading, activeTab } = useProfileUI()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileContent />
      
      case 'settings':
        return <SettingsPanel />
      
      case 'credits':
        return <CreditsDashboard />
      
      case 'notifications':
        return <NotificationsPanel />
      
      default:
        return <ProfileContent />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile Header */}
        <ProfileHeaderEnhanced />

        {/* Main Tabs */}
        <ProfileTabs />

        {/* Content */}
        <div className="bg-card rounded-xl shadow-lg p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }>
            {renderTabContent()}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <ProfileProvider>
      <ProfileLayoutContent>{children}</ProfileLayoutContent>
    </ProfileProvider>
  )
}
