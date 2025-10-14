'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
// Redirect to main profile page (settings are now integrated)
export default function ProfileSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/profile')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-muted-foreground">Redirecting to profile...</p>
      </div>
    </div>
  )
}
