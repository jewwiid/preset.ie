'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import CreditPurchase from '../../components/CreditPurchase'
import { ArrowLeft } from 'lucide-react'

export default function CreditPurchasePage() {
  const router = useRouter()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to purchase credits</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-preset-500 text-white rounded-lg hover:bg-preset-600 transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <CreditPurchase 
          onPurchaseComplete={() => {
            // Optionally redirect after purchase
            setTimeout(() => {
              router.push('/dashboard')
            }, 3000)
          }}
        />
      </div>
    </div>
  )
}