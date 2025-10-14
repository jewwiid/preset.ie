'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
export default function MarketplaceMyListingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the correct location
    router.replace('/presets/marketplace/my-listings')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
