'use client'

import React from 'react'
import { useProfileUI, useProfileEditing } from '../context/ProfileContext'
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

  // Only show tabs when in edit mode
  if (!isEditing) {
    return null
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-1 mb-6">
      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
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
  { id: 'talent', label: 'Talent', icon: Users }
]

interface ProfileSubTabsProps {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
}

export function ProfileSubTabs({ activeSubTab, onSubTabChange }: ProfileSubTabsProps) {
  return (
    <div className="bg-muted rounded-lg p-1 mb-6">
      <div className="flex space-x-1">
        {profileSubTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
