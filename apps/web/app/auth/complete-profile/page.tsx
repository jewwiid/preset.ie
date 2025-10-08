'use client'

import { StreamlinedProfileProvider } from '../../../components/auth/streamlined-profile/StreamlinedProfileProvider'
import { StreamlinedProfileLayout } from '../../../components/auth/streamlined-profile/StreamlinedProfileLayout'

export default function CompleteProfilePage() {
    return (
    <StreamlinedProfileProvider>
      <StreamlinedProfileLayout />
    </StreamlinedProfileProvider>
  )
}