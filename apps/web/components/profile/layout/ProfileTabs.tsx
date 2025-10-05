'use client'

import React from 'react'
import { useProfileUI, useProfileEditing, useProfile } from '../context/ProfileContext'
import { UserProfile } from '../../../lib/types/dashboard'
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell,
  Palette,
  Briefcase,
  Star,
  Users,
  Shield,
  Globe
} from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'credits', label: 'Credits', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell }
]

export function ProfileTabs() {
  const { activeTab, setActiveTab } = useProfileUI()
  const { isEditing } = useProfileEditing()

  // Always show tabs - they control navigation between different sections

  return (
    <div className="bg-card rounded-xl shadow-lg p-1 mb-6">
      <div className="flex justify-center space-x-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Sub-tabs for profile section
interface ProfileSubTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const profileSubTabs: ProfileSubTab[] = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'demographics', label: 'Demographics', icon: Globe },
  { id: 'work-preferences', label: 'Work Preferences', icon: Briefcase },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'professional', label: 'Professional', icon: Star },
  { id: 'talent', label: 'Talent', icon: Users },
  { id: 'contributor', label: 'Contributor', icon: Users }
]

interface ProfileSubTabsProps {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
}

export function ProfileSubTabs({ activeSubTab, onSubTabChange }: ProfileSubTabsProps) {
  const { profile } = useProfile()
  
  // Filter tabs based on user role
  const getVisibleTabs = () => {
    const profileData = profile as UserProfile | null
    const hasTalentRole = profileData?.role_flags?.includes('TALENT')
    const hasContributorRole = profileData?.role_flags?.includes('CONTRIBUTOR')
    
    return profileSubTabs.filter(tab => {
      if (tab.id === 'talent' && !hasTalentRole) return false
      if (tab.id === 'contributor' && !hasContributorRole) return false
      return true
    })
  }

  const visibleTabs = getVisibleTabs()

  return (
    <div className="bg-muted rounded-lg p-1 mb-6">
      <div className="flex justify-center space-x-1 overflow-x-auto scrollbar-hide">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)}
              className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
