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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile Header */}
        <ProfileHeaderEnhanced />

        {/* Main Tabs */}
        <ProfileTabs />

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
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
