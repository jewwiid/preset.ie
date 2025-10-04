'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { ProfileLayout } from '../../components/profile/layout/ProfileLayout'
import { ProfileContent } from '../../components/profile/sections/ProfileContent'

// Main Profile Page - Combined view and edit functionality
export default function ProfilePage() {
  return (
    <ProfileLayout>
      <ProfileContent />
    </ProfileLayout>
  )
}
