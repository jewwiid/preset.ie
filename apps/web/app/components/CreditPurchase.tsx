'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [userProfile, setUserProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (user) {
      fetchCreditInfo()
    }
  }, [user?.id]) // Only depend on user ID, not the entire user object

  const fetchCreditInfo = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session) throw new Error('No session')

      // Get packages and platform capacity with cache busting
      const packagesResponse = await fetch(`/api/credits/purchase?t=${Date.now()}&include_lootbox=false`, {
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
        .select('current_balance, monthly_allowance, consumed_this_month, subscription_tier, last_reset_at')
        .eq('user_id', user.id)
        .single()

      // Get user profile for subscription tier and profile info
      const { data: profile } = await supabase
        .from('users_profile')
        .select('subscription_tier, display_name, handle, avatar_url, subscription_started_at, subscription_expires_at')
        .eq('user_id', user.id)
        .single()

      const subscriptionTier = profile?.subscription_tier || 'FREE'
      const canPurchase = subscriptionTier === 'PLUS' || subscriptionTier === 'PRO'

      setCreditInfo({
        packages: packagesData.packages,
        lootboxPackages: packagesData.lootboxPackages || [],
        platformCapacity: packagesData.platformCapacity,
        currentBalance: userCredits?.current_balance || 0,
        monthlyAllowance: userCredits?.monthly_allowance || 0,
        consumedThisMonth: userCredits?.consumed_this_month || 0,
        subscriptionTier,
        canPurchase,
        lastResetAt: userCredits?.last_reset_at,
        subscriptionStartedAt: profile?.subscription_started_at,
        subscriptionExpiresAt: profile?.subscription_expires_at
      })

      // Set user profile data
      setUserProfile({
        display_name: profile?.display_name || 'User',
        handle: profile?.handle || 'user',
        avatar_url: profile?.avatar_url
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
        
        // Clear success message after 3 seconds (no auto-refresh)
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
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

  const checkLootboxAvailability = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session) throw new Error('No session')
      
      const response = await fetch(`/api/lootbox/availability?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to check lootbox availability')
      }
      
      // Update only the lootbox packages in the existing credit info
      setCreditInfo((prev: any) => ({
        ...prev,
        lootboxPackages: data.lootbox.available_packages || []
      }))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check lootbox availability')
    } finally {
      setLoading(false)
    }
  }, [user])

  const purchaseLootbox = async (packageId: string) => {
    if (!user) return
    
    setPurchasing(packageId)
    setError(null)
    setSuccess(null)
    
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session) throw new Error('No session')

      // Find the lootbox package details
      const selectedPackage = creditInfo?.lootboxPackages?.find((pkg: any) => pkg.id === packageId)
      if (!selectedPackage) {
        setError('Lootbox package not found')
        return
      }

      const response = await fetch('/api/lootbox/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({ 
          packageId: selectedPackage.id,
          userCredits: selectedPackage.user_credits,
          priceUsd: selectedPackage.price_usd
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`🎉 Lootbox purchased! You got ${selectedPackage.user_credits} credits!`)
        setCreditInfo((prev: any) => ({
          ...prev,
          currentBalance: data.new_balance
        }))
        
        if (onPurchaseComplete) {
          onPurchaseComplete()
        }
        
        // Clear success message after 3 seconds (no auto-refresh)
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      } else {
        setError(data.error || data.message)
      }
    } catch (err: any) {
      console.error('Lootbox purchase error:', err)
      setError('Failed to complete lootbox purchase')
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

      {/* Current Balance - Dashboard Style */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl mb-6">
        {/* Profile Header */}
        {userProfile && (
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
            {/* User Avatar */}
            <div className="relative">
              {userProfile.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt={userProfile.display_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-preset-200 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-preset-400 to-preset-600 rounded-full flex items-center justify-center border-2 border-preset-200 shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {userProfile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              {/* Online status indicator */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{userProfile.display_name}</h2>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {creditInfo?.subscriptionTier || 'FREE'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">@{userProfile.handle}</span>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span className="text-gray-500 text-sm">Contributor & Talent</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}


        {/* Circular Credit Gauge */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Circular Progress Ring */}
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f3f4f6"
                strokeWidth="8"
                fill="none"
                className="drop-shadow-sm"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={(() => {
                  const totalCredits = creditInfo.currentBalance + creditInfo.consumedThisMonth
                  const lowThreshold = Math.max(5, Math.floor(totalCredits * 0.15)) // Dynamic low threshold (15% of total, min 5)
                  const mediumThreshold = Math.max(10, Math.floor(totalCredits * 0.35)) // Dynamic medium threshold (35% of total, min 10)
                  
                  if (creditInfo.currentBalance >= mediumThreshold) return "#10b981" // Green - High
                  if (creditInfo.currentBalance >= lowThreshold) return "#f59e0b" // Amber - Medium
                  return "#ef4444" // Red - Low
                })()}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (creditInfo.currentBalance / (creditInfo.currentBalance + creditInfo.consumedThisMonth)))}`}
                className="transition-all duration-700 ease-out drop-shadow-md"
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-bold transition-colors duration-500 ${
                (() => {
                  const totalCredits = creditInfo.currentBalance + creditInfo.consumedThisMonth
                  const lowThreshold = Math.max(5, Math.floor(totalCredits * 0.15))
                  const mediumThreshold = Math.max(10, Math.floor(totalCredits * 0.35))
                  
                  if (creditInfo.currentBalance >= mediumThreshold) return 'text-emerald-600'
                  if (creditInfo.currentBalance >= lowThreshold) return 'text-amber-600'
                  return 'text-red-600'
                })()
              }`}>
                {creditInfo.currentBalance}
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">CREDITS</div>
            </div>
            
            {/* Dynamic Threshold Indicators */}
            <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-center">
              <div className={`text-lg font-bold transition-colors duration-500 ${
                (() => {
                  const totalCredits = creditInfo.currentBalance + creditInfo.consumedThisMonth
                  const lowThreshold = Math.max(5, Math.floor(totalCredits * 0.15))
                  
                  if (creditInfo.currentBalance >= lowThreshold) return 'text-emerald-600'
                  return 'text-red-600'
                })()
              }`}>
                {(() => {
                  const totalCredits = creditInfo.currentBalance + creditInfo.consumedThisMonth
                  return Math.max(5, Math.floor(totalCredits * 0.15))
                })()}
              </div>
              <div className={`text-xs font-medium transition-colors duration-500 ${
                (() => {
                  const totalCredits = creditInfo.currentBalance + creditInfo.consumedThisMonth
                  const lowThreshold = Math.max(5, Math.floor(totalCredits * 0.15))
                  
                  if (creditInfo.currentBalance >= lowThreshold) return 'text-emerald-500'
                  return 'text-red-500'
                })()
              }`}>
                LOW
              </div>
            </div>
            <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 text-center">
              <div className="text-lg font-bold text-gray-400">{creditInfo.currentBalance + creditInfo.consumedThisMonth}</div>
              <div className="text-xs text-gray-400">TOTAL</div>
            </div>
          </div>
        </div>

        {/* Credit Details Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Available Credits Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-emerald-600 text-sm font-semibold mb-1">Available Credits</p>
              <p className="text-gray-900 text-2xl font-bold">{creditInfo.currentBalance}</p>
            </div>
          </div>

          {/* Usage Tracking Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-blue-600 text-sm font-semibold mb-1">Used This Month</p>
              <p className="text-gray-900 text-2xl font-bold">{creditInfo.consumedThisMonth}</p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {/* Monthly Reset with Horizontal Progress */}
            <div className="flex flex-col gap-2">
              {(() => {
                const today = new Date()
                
                // Use real subscription billing data from database
                let lastResetDate: Date
                let nextResetDate: Date
                
                if (creditInfo?.subscriptionExpiresAt) {
                  // Use subscription expiration date for paid plans
                  nextResetDate = new Date(creditInfo.subscriptionExpiresAt)
                  
                  // Calculate last reset based on subscription start or last credit reset
                  if (creditInfo?.lastResetAt) {
                    lastResetDate = new Date(creditInfo.lastResetAt)
                  } else if (creditInfo?.subscriptionStartedAt) {
                    lastResetDate = new Date(creditInfo.subscriptionStartedAt)
                  } else {
                    // Fallback to 30 days before expiration
                    lastResetDate = new Date(nextResetDate)
                    lastResetDate.setDate(lastResetDate.getDate() - 30)
                  }
                } else if (creditInfo?.lastResetAt) {
                  // Use credit reset date for free users or fallback
                  lastResetDate = new Date(creditInfo.lastResetAt)
                  
                  // Calculate next reset based on subscription tier
                  const cycleDays = creditInfo.subscriptionTier === 'FREE' ? 30 : 30 // All plans use monthly cycles
                  nextResetDate = new Date(lastResetDate)
                  nextResetDate.setDate(nextResetDate.getDate() + cycleDays)
                  
                  // If next reset is in the past, calculate the current cycle
                  while (nextResetDate <= today) {
                    lastResetDate = new Date(nextResetDate)
                    nextResetDate.setDate(nextResetDate.getDate() + cycleDays)
                  }
                } else {
                  // Fallback to calendar month if no subscription data
                  lastResetDate = new Date(today.getFullYear(), today.getMonth(), 1)
                  nextResetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
                }
                
                const daysInCycle = Math.floor((nextResetDate.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24))
                const daysPassed = Math.floor((today.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24))
                const cycleProgress = Math.min(daysPassed / daysInCycle, 1)
                const daysUntilReset = Math.ceil((nextResetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <>
                    {/* Horizontal Progress Bar with Date Labels */}
                    <div className="flex items-center justify-between">
                      {/* Today - Left Side */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-200">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-lg font-bold text-gray-900">{lastResetDate.getDate()}</div>
                          <div className="text-xs text-gray-500">{lastResetDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 mx-6">
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${cycleProgress * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-xs text-gray-500">
                            {daysUntilReset} days left
                          </span>
                        </div>
                      </div>
                      
                      {/* Reset - Right Side */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col text-right">
                          <div className="text-lg font-bold text-gray-900">{nextResetDate.getDate()}</div>
                          <div className="text-xs text-gray-500">{nextResetDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                        </div>
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
            
            {/* Subscription Tier Button */}
            <button
              onClick={() => window.location.href = '/subscription'}
              className={`group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md ${
                creditInfo.subscriptionTier === 'PRO' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700' 
                  : creditInfo.subscriptionTier === 'PLUS'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{creditInfo.subscriptionTier}</span>
                <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              {/* Subtle glow effect */}
              <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200 ${
                creditInfo.subscriptionTier === 'PRO' 
                  ? 'bg-purple-400' 
                  : creditInfo.subscriptionTier === 'PLUS'
                    ? 'bg-blue-400'
                    : 'bg-gray-400'
              }`}></div>
            </button>
          </div>
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
        <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Credit Packages</h2>
        </div>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Regular Packages */}
            {creditInfo.packages?.map((pkg: any) => {
              const isPopular = pkg.id === 'creative'
              const savings = pkg.id === 'creative' ? 20 : pkg.id === 'pro' ? 30 : pkg.id === 'studio' ? 40 : 0
              
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-lg border-2 p-6 flex flex-col h-full ${
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
                  
                  <div className="text-center flex-grow flex flex-col justify-center">
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
                      <div className="mt-3 mb-2">
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

            {/* Lootbox Status Card - Only show when no lootbox packages are available */}
            {(!creditInfo.lootboxPackages || creditInfo.lootboxPackages.length === 0) && (
              <div className="relative rounded-lg border-2 p-6 flex flex-col h-full border-gray-200 hover:border-gray-300">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold shadow-md bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    🎁 LOOTBOX
                  </span>
                </div>
                
                <div className="text-center flex-grow flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-900">Lootbox Status</h3>
                  <div className="mt-2">
                    <span className="text-6xl font-bold text-gray-400">???</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Special offers available
                  </div>
                </div>
                
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    checkLootboxAvailability()
                  }}
                  className="w-full py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                  style={{ pointerEvents: loading ? 'none' : 'auto' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Lootbox Packages - Show when available */}
            {creditInfo.lootboxPackages && creditInfo.lootboxPackages.length > 0 && 
              creditInfo.lootboxPackages.map((pkg: any) => (
              <div
                key={pkg.id}
                className={`relative rounded-lg border-2 p-6 shadow-lg flex flex-col h-full ${
                  pkg.available 
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
                    : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 opacity-75'
                }`}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                    pkg.available 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                      : 'bg-gray-400 text-gray-100'
                  }`}>
                    🎁 LOOTBOX
                  </span>
                </div>
                
                <div className="text-center flex-grow flex flex-col justify-center">
                  <h3 className={`text-xl font-bold ${pkg.available ? 'text-gray-900' : 'text-gray-500'}`}>
                    {pkg.name}
                  </h3>

                  <div className="mt-2">
                    <span className={`text-3xl font-bold ${pkg.available ? 'text-orange-600' : 'text-gray-400'}`}>
                      {pkg.user_credits}
                    </span>
                    <span className={`ml-1 ${pkg.available ? 'text-gray-600' : 'text-gray-400'}`}>credits</span>
                  </div>

                  <div className="mt-1">
                    <span className={`text-2xl font-bold ${pkg.available ? 'text-emerald-600' : 'text-gray-400'}`}>
                      ${pkg.price_usd.toFixed(2)}
                    </span>
                  </div>

                  <div className={`text-sm mt-1 ${pkg.available ? 'text-gray-500' : 'text-gray-400'}`}>
                    ${pkg.price_per_credit.toFixed(3)} per credit
                  </div>

                  {pkg.savings_percentage > 0 && (
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold shadow-md ${
                        pkg.available
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        💰 Save {pkg.savings_percentage}%
                      </span>
                    </div>
                  )}

                </div>
                
                <button
                  onClick={() => purchaseLootbox(pkg.id)}
                  disabled={purchasing !== null || !pkg.available}
                  className={`w-full py-2 px-4 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                    pkg.available
                      ? 'text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {purchasing === pkg.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Claiming...
                    </>
                  ) : !pkg.available ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Locked
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Claim Lootbox
                    </>
                  )}
                </button>
              </div>
              ))
            }
          </div>
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

      {/* How Credits Work Section */}
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900">How Credits Work</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">1 Credit = 1 Enhancement</p>
                <p className="text-sm text-gray-600">Each credit powers one AI image enhancement in your moodboards</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Credits Never Expire</p>
                <p className="text-sm text-gray-600">Your purchased credits remain in your account indefinitely</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Monthly Allowance</p>
                <p className="text-sm text-gray-600">Free credits reset on the 1st of each month based on your subscription tier</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Instant Activation</p>
                <p className="text-sm text-gray-600">Purchased credits are added to your balance immediately</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">AI-Powered</p>
                <p className="text-sm text-gray-600">Powered by advanced AI technology for professional-quality enhancements</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Moodboard Integration</p>
                <p className="text-sm text-gray-600">Use credits to enhance images in your creative moodboards</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Reliable Service:</span>
            <span>Credits are backed by our platform's infrastructure for consistent availability</span>
          </div>
        </div>
      </div>
    </div>
  )
}