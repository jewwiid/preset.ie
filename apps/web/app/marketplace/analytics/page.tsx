'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MarketplaceAnalyticsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/presets/marketplace/analytics')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to analytics...</p>
      </div>
    </div>
  )
}
