'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { CreditCard, Sparkles, Loader2, Check, X } from 'lucide-react'

interface CreditPackage {
  credits: number
  price: number
  name: string
}

interface CreditPurchaseProps {
  onPurchaseComplete?: () => void
  embedded?: boolean
}

export default function CreditPurchase({ onPurchaseComplete, embedded = false }: CreditPurchaseProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [creditInfo, setCreditInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCreditInfo()
    }
  }, [user])

  const fetchCreditInfo = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session) throw new Error('No session')

      // Get packages and platform capacity
      const packagesResponse = await fetch('/api/credits/purchase', {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`
        }
      })

      const packagesData = await packagesResponse.json()
      
      if (packagesData.error) {
        setError(packagesData.error)
        return
      }

      // Get user's current credit balance
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('current_balance, monthly_allowance, consumed_this_month, subscription_tier')
        .eq('user_id', user.id)
        .single()

      // Get user profile for subscription tier
      const { data: profile } = await supabase
        .from('users_profile')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single()

      const subscriptionTier = profile?.subscription_tier || 'FREE'
      const canPurchase = subscriptionTier === 'PLUS' || subscriptionTier === 'PRO'

      setCreditInfo({
        packages: packagesData.packages,
        platformCapacity: packagesData.platformCapacity,
        currentBalance: userCredits?.current_balance || 0,
        monthlyAllowance: userCredits?.monthly_allowance || 0,
        consumedThisMonth: userCredits?.consumed_this_month || 0,
        subscriptionTier,
        canPurchase
      })
    } catch (err: any) {
      console.error('Error fetching credit info:', err)
      setError('Failed to load credit information')
    } finally {
      setLoading(false)
    }
  }

  const purchaseCredits = async (packageId: string) => {
    if (!user) return
    
    setPurchasing(packageId)
    setError(null)
    setSuccess(null)
    
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session) throw new Error('No session')

      // Find the package details
      const selectedPackage = creditInfo?.packages?.find((pkg: any) => pkg.id === packageId)
      if (!selectedPackage) {
        setError('Package not found')
        return
      }

      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({ 
          packageId: selectedPackage.id,
          userCredits: selectedPackage.credits,
          priceUsd: selectedPackage.price_usd
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Successfully purchased ${selectedPackage.credits} credits!`)
        setCreditInfo((prev: any) => ({
          ...prev,
          currentBalance: data.newBalance
        }))
        
        if (onPurchaseComplete) {
          onPurchaseComplete()
        }
        
        // Refresh after 2 seconds
        setTimeout(() => {
          fetchCreditInfo()
          setSuccess(null)
        }, 2000)
      } else {
        setError(data.error || data.message)
      }
    } catch (err: any) {
      console.error('Purchase error:', err)
      setError('Failed to complete purchase')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className={`${embedded ? '' : 'min-h-screen'} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!creditInfo) {
    return null
  }

  return (
    <div className={`${embedded ? '' : 'max-w-4xl mx-auto p-6'}`}>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Credits</h1>
          <p className="text-gray-600">Buy additional credits for AI image enhancements</p>
        </div>
      )}

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Credit Balance</h3>
            <div className="mt-2 space-y-1">
              <p className="text-3xl font-bold text-purple-600">{creditInfo.currentBalance} credits</p>
              <p className="text-sm text-gray-600">
                Monthly allowance: {creditInfo.monthlyAllowance} credits
              </p>
              <p className="text-sm text-gray-600">
                Used this month: {creditInfo.consumedThisMonth} credits
              </p>
            </div>
          </div>
          <Sparkles className="w-12 h-12 text-purple-400" />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <X className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Credit Packages */}
      {creditInfo.canPurchase ? (
        <div className="grid md:grid-cols-3 gap-4">
          {creditInfo.packages?.map((pkg: any) => {
            const isPopular = pkg.id === 'creative'
            const savings = pkg.id === 'creative' ? 20 : pkg.id === 'pro' ? 33 : 0
            
            return (
              <div
                key={pkg.id}
                className={`relative rounded-lg border-2 p-6 ${
                  isPopular 
                    ? 'border-purple-500 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${!pkg.available ? 'opacity-50' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">{pkg.credits}</span>
                    <span className="text-gray-600 ml-1">credits</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-emerald-600">${pkg.price_usd.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    ${(pkg.price_usd / pkg.credits).toFixed(3)} per credit
                  </div>
                  {savings > 0 && (
                    <div className="mt-2">
                      <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                        Save {savings}%
                      </span>
                    </div>
                  )}
                  {!pkg.available && (
                    <div className="mt-2">
                      <span className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                        Temporarily Unavailable
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => purchaseCredits(pkg.id)}
                  disabled={purchasing !== null || !pkg.available}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50`}
                >
                  {purchasing === pkg.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      {!pkg.available ? 'Unavailable' : 'Purchase'}
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Upgrade to Purchase Credits
          </h3>
          <p className="text-yellow-700 mb-4">
            Credit purchases are available for Plus and Pro subscribers only.
          </p>
          <p className="text-sm text-yellow-600 mb-4">
            Your current tier: <span className="font-semibold">{creditInfo.subscriptionTier}</span>
          </p>
          <button
            onClick={() => window.location.href = '/subscription'}
            className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">How Credits Work</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• 1 credit = 1 AI image enhancement</li>
          <li>• Credits never expire</li>
          <li>• Monthly allowance resets on the 1st of each month</li>
          <li>• Purchased credits are added to your balance immediately</li>
          <li>• Use credits for NanoBanana AI enhancements in moodboards</li>
        </ul>
      </div>
    </div>
  )
}