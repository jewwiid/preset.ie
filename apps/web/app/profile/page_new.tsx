'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { ProfileLayout } from '../../components/profile/layout/ProfileLayout'
import { ProfileContent } from '../../components/profile/sections/ProfileContent'
import { SettingsPanel } from '../../components/profile/sections/SettingsPanel'
import { useProfileUI } from '../../components/profile/context/ProfileContext'

// This is a complete example of how the refactored profile page works
// It demonstrates the new component architecture while preserving all edit functionality

function ProfilePageContent() {
  const { activeTab } = useProfileUI()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileContent />
      
      case 'settings':
        return <SettingsPanel />
      
      case 'credits':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Credits dashboard coming soon...
            </p>
          </div>
        )
      
      case 'notifications':
        return (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Notifications settings coming soon...
            </p>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Select a tab to get started
            </p>
          </div>
        )
    }
  }

  return (
    <div>
      {renderTabContent()}
    </div>
  )
}

export default function ProfilePageNew() {
  return (
    <ProfileLayout>
      <ProfilePageContent />
    </ProfileLayout>
  )
}
