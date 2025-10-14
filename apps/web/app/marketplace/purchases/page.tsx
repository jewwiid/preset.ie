'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
export default function MarketplacePurchasesRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/presets/marketplace/purchases')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="text-muted-foreground">Redirecting to purchase history...</p>
      </div>
    </div>
  )
}
