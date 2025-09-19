'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { ProfileLayout } from '../../../components/profile/layout/ProfileLayout'
import { ProfileContent } from '../../../components/profile/sections/ProfileContent'
import { SettingsPanel } from '../../../components/profile/sections/SettingsPanel'

// Profile Settings Page - The original profile editing functionality
// This is the settings/editing page that was previously at /profile

export default function ProfileSettingsPage() {
  return (
    <ProfileLayout>
      <ProfileContent />
    </ProfileLayout>
  )
}
