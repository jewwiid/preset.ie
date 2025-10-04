'use client'

import React from 'react'
import { useProfileEditing, useProfileUI } from '../context/ProfileContext'
import { ProfileContentEnhanced } from './ProfileContentEnhanced'
import { ProfileSubTabs } from '../layout/ProfileTabs'
import { PersonalInfoSection } from './PersonalInfoSection'
import { DemographicsSection } from './DemographicsSection'
import { WorkPreferencesSection } from './WorkPreferencesSection'
import { PrivacySettingsSection } from './PrivacySettingsSection'
import { StyleSection } from './StyleSection'
import { ProfessionalSection } from './ProfessionalSection'
import { TalentSpecificSection } from './TalentSpecificSection'

export function ProfileContent() {
  const { isEditing } = useProfileEditing()
  const { activeSubTab, setActiveSubTab } = useProfileUI()

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'personal':
        return <PersonalInfoSection />
      case 'demographics':
        return <DemographicsSection />
      case 'work-preferences':
        return <WorkPreferencesSection />
      case 'privacy':
        return <PrivacySettingsSection />
      case 'style':
        return <StyleSection />
      case 'professional':
        return <ProfessionalSection />
      case 'talent':
        return <TalentSpecificSection />
      default:
        return <PersonalInfoSection />
    }
  }

  // Always show sub-tabs for navigation, but content varies based on edit mode
  return (
    <div>
      <ProfileSubTabs 
        activeSubTab={activeSubTab} 
        onSubTabChange={setActiveSubTab} 
      />
      {isEditing ? renderSubTabContent() : <ProfileContentEnhanced />}
    </div>
  )
}
