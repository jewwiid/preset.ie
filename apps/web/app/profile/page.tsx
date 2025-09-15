'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { ProfileLayout } from '../../components/profile/layout/ProfileLayout'
import { ProfileContent } from '../../components/profile/sections/ProfileContent'
import { SettingsPanel } from '../../components/profile/sections/SettingsPanel'

// Main Profile Page - Refactored Implementation
// This is the new refactored profile page that replaces the original 6500+ line monolithic component
// It uses a clean, modular architecture while preserving 100% of the edit functionality

export default function ProfilePage() {
  return (
    <ProfileLayout>
      <ProfileContent />
    </ProfileLayout>
  )
}
