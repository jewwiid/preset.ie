'use client'

import { useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { Sparkles, Loader2, Check, X } from 'lucide-react'
import { useCreditPurchase } from '../../hooks/useCreditPurchase'
import { CreditPackageCard } from '../../components/credits/CreditPackageCard'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
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

  const credit = useCreditPurchase({
    userId: user?.id,
    onPurchaseComplete
  })

  useEffect(() => {
    if (user) {
      credit.fetchCreditInfo()
    }
  }, [user?.id]) // Only depend on user ID, not the entire user object

  if (credit.loading) {
    return (
      <div className={`${embedded ? '' : 'min-h-screen'} flex items-center justify-center`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!credit.creditInfo) {
    return (
      <div className={`${embedded ? '' : 'min-h-screen'} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-muted-foreground">Loading credit information...</p>
          {credit.error && <p className="text-destructive mt-2">{credit.error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`${embedded ? '' : 'max-w-4xl mx-auto p-6'}`}>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Purchase Credits</h1>
          <p className="text-muted-foreground">Buy additional credits for AI image enhancements</p>
        </div>
      )}

      {/* Current Balance - Row Layout */}
      <div className="bg-background/90 backdrop-blur-sm rounded-2xl p-6 border border-border/20 shadow-xl mb-6">
        {/* Main Row Layout */}
        <div className="flex items-center gap-6">
          {/* Left: User Profile */}
          {credit.userProfile && (
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <div className="relative">
                {credit.userProfile.avatar_url ? (
                  <img
                    src={credit.userProfile.avatar_url}
                    alt={credit.userProfile.display_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center border-2 border-primary/20 shadow-lg">
                    <span className="text-primary-foreground font-bold text-xl">
                      {credit.userProfile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                {/* Online status indicator */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 border-2 border-border rounded-full"></div>
              </div>

              {/* User Info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-foreground">{credit.userProfile.display_name}</h2>
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-semibold rounded-full">
                    {credit.creditInfo?.subscriptionTier || 'FREE'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">@{credit.userProfile.handle}</span>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground text-sm">Contributor & Talent</span>
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {/* Center: Credit Gauge */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              {/* Smaller Circular Progress Ring */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke="#f3f4f6"
                  strokeWidth="6"
                  fill="none"
                  className="drop-shadow-sm"
                />
                {/* Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke={(() => {
                    const totalCredits = credit.creditInfo.currentBalance + credit.creditInfo.consumedThisMonth
                    const lowThreshold = Math.max(5, Math.floor(totalCredits * 0.15))
                    const mediumThreshold = Math.max(10, Math.floor(totalCredits * 0.35))

                    if (credit.creditInfo.currentBalance >= mediumThreshold) return "#10b981"
                    if (credit.creditInfo.currentBalance >= lowThreshold) return "#f59e0b"
                    return "#ef4444"
                  })()}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${2 * Math.PI * 35 * (1 - (credit.creditInfo.currentBalance / (credit.creditInfo.currentBalance + credit.creditInfo.consumedThisMonth)))}`}
                  className="transition-all duration-700 ease-out drop-shadow-md"
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-2xl font-bold transition-colors duration-500 ${
                  (() => {
                    const totalCredits = credit.creditInfo.currentBalance + credit.creditInfo.consumedThisMonth
                    const lowThreshold = Math.max(5, Math.floor(totalCredits * 0.15))
                    const mediumThreshold = Math.max(10, Math.floor(totalCredits * 0.35))

                    if (credit.creditInfo.currentBalance >= mediumThreshold) return 'text-primary-600'
                    if (credit.creditInfo.currentBalance >= lowThreshold) return 'text-amber-600'
                    return 'text-destructive'
                  })()
                }`}>
                  {credit.creditInfo.currentBalance}
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CREDITS</div>
              </div>
            </div>
          </div>

          {/* Right: Credit Details Cards */}
          <div className="flex gap-4">
            {/* Available Credits Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] min-w-[120px]">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <p className="text-primary-600 text-xs font-semibold mb-1">Available</p>
                <p className="text-muted-foreground-900 text-xl font-bold">{credit.creditInfo.currentBalance}</p>
              </div>
            </div>

            {/* Usage Tracking Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] min-w-[120px]">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-primary-600 text-xs font-semibold mb-1">Used</p>
                <p className="text-muted-foreground-900 text-xl font-bold">{credit.creditInfo.consumedThisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Subscription Info */}
        <div className="mt-6 pt-4 border-t border-border-100">
          <div className="flex items-center justify-between">
            {/* Monthly Reset with Horizontal Progress */}
            <div className="flex flex-col gap-2">
              {(() => {
                const today = new Date()
                
                // Use real subscription billing data from database
                let lastResetDate: Date
                let nextResetDate: Date

                if (credit.creditInfo?.subscriptionExpiresAt) {
                  // Use subscription expiration date for paid plans
                  nextResetDate = new Date(credit.creditInfo.subscriptionExpiresAt)

                  // Calculate last reset based on subscription start or last credit reset
                  if (credit.creditInfo?.lastResetAt) {
                    lastResetDate = new Date(credit.creditInfo.lastResetAt)
                  } else if (credit.creditInfo?.subscriptionStartedAt) {
                    lastResetDate = new Date(credit.creditInfo.subscriptionStartedAt)
                  } else {
                    // Fallback to 30 days before expiration
                    lastResetDate = new Date(nextResetDate)
                    lastResetDate.setDate(lastResetDate.getDate() - 30)
                  }
                } else if (credit.creditInfo?.lastResetAt) {
                  // Use credit reset date for free users or fallback
                  lastResetDate = new Date(credit.creditInfo.lastResetAt)

                  // Calculate next reset based on subscription tier
                  const cycleDays = credit.creditInfo.subscriptionTier === 'FREE' ? 30 : 30 // All plans use monthly cycles
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
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center border border-primary/20">
                          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-lg font-bold text-muted-foreground-900">{lastResetDate.getDate()}</div>
                          <div className="text-xs text-muted-foreground-500">{lastResetDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 mx-6">
                        <div className="relative h-2 bg-muted-100 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-primary to-primary-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${cycleProgress * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-xs text-muted-foreground-500">
                            {daysUntilReset} days left
                          </span>
                        </div>
                      </div>
                      
                      {/* Reset - Right Side */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col text-right">
                          <div className="text-lg font-bold text-muted-foreground-900">{nextResetDate.getDate()}</div>
                          <div className="text-xs text-muted-foreground-500">{nextResetDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                        </div>
                        <div className="w-10 h-10 bg-muted-50 rounded-lg flex items-center justify-center border border-border-200">
                          <svg className="w-5 h-5 text-muted-foreground-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                credit.creditInfo.subscriptionTier === 'PRO'
                  ? 'bg-primary text-primary-foreground hover:from-primary/90 hover:to-primary'
                  : credit.creditInfo.subscriptionTier === 'PLUS'
                    ? 'bg-primary text-primary-foreground hover:from-primary/90 hover:to-primary'
                    : 'bg-gradient-to-r from-muted to-muted/80 text-muted-foreground hover:from-muted/80 hover:to-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{credit.creditInfo.subscriptionTier}</span>
                <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Subtle glow effect */}
              <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200 ${
                credit.creditInfo.subscriptionTier === 'PRO'
                  ? 'bg-primary-400'
                  : credit.creditInfo.subscriptionTier === 'PLUS'
                    ? 'bg-primary-400'
                    : 'bg-muted-400'
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {credit.error && (
        <div className="mb-4 p-4 bg-destructive-50 border border-destructive-200 rounded-md flex items-center gap-2">
          <X className="w-5 h-5 text-destructive-500" />
          <p className="text-destructive-700">{credit.error}</p>
        </div>
      )}

      {credit.success && (
        <div className="mb-4 p-4 bg-primary-50 border border-primary/20 rounded-md flex items-center gap-2">
          <Check className="w-5 h-5 text-primary-500" />
          <p className="text-primary-700">{credit.success}</p>
        </div>
      )}

      {/* Credit Packages */}
      {credit.creditInfo.canPurchase ? (
        <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-muted-foreground-900">Credit Packages</h2>
        </div>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Regular Packages */}
            {credit.creditInfo.packages?.map((pkg: any) => {
              const isPopular = pkg.id === 'creative'
              const savings = pkg.id === 'creative' ? 20 : pkg.id === 'pro' ? 30 : pkg.id === 'studio' ? 40 : 0

              return (
                <CreditPackageCard
                  key={pkg.id}
                  packageData={pkg}
                  isPopular={isPopular}
                  savings={savings}
                  isPurchasing={credit.purchasing === pkg.id}
                  onPurchase={(id) => credit.purchasePackage(id, false)}
                  disabled={credit.purchasing !== null}
                />
              )
            })}

            {/* Lootbox Status Card - Only show when no lootbox packages are available */}
            {(!credit.creditInfo.lootboxPackages || credit.creditInfo.lootboxPackages.length === 0) && (
              <div className="relative rounded-lg border-2 p-6 flex flex-col h-full border-border-200 hover:border-border-300">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold shadow-md bg-primary text-primary-foreground">
                    🎁 LOOTBOX
                  </span>
                </div>

                <div className="text-center flex-grow flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-muted-foreground-900">Lootbox Status</h3>
                  <div className="mt-2">
                    <span className="text-6xl font-bold text-muted-foreground-400">???</span>
                  </div>
                  <div className="text-sm text-muted-foreground-500 mt-1">
                    Special offers available
                  </div>
                </div>

                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    credit.checkLootboxAvailability()
                  }}
                  className="w-full py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 bg-muted-900 text-primary-foreground hover:bg-muted-800 disabled:opacity-50 cursor-pointer"
                  style={{ pointerEvents: credit.loading ? 'none' : 'auto' }}
                >
                  {credit.loading ? (
                    <>
                      <LoadingSpinner size="sm" />
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
            {credit.creditInfo.lootboxPackages && credit.creditInfo.lootboxPackages.length > 0 &&
              credit.creditInfo.lootboxPackages.map((pkg: any) => {
                // Map lootbox package fields to match CreditPackageCard interface
                const mappedPackage = {
                  id: pkg.id,
                  name: pkg.name,
                  credits: pkg.user_credits || pkg.credits,
                  price_usd: pkg.price_usd,
                  available: pkg.available
                };

                return (
                  <div key={pkg.id} className="relative rounded-lg border-2 p-6 flex flex-col h-full border-border-200 hover:border-border-300">
                    {/* Animated glow effect for available lootbox */}
                    {pkg.available && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 opacity-50 blur-xl animate-pulse"></div>
                    )}

                    {/* Flash Sale Badge */}
                    {pkg.available && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-white text-xs font-black rounded shadow-lg animate-pulse">
                          ⚡ FLASH SALE ⚡
                        </span>
                      </div>
                    )}

                    <div className="relative z-10">
                      <CreditPackageCard
                        packageData={mappedPackage}
                        isPurchasing={credit.purchasing === pkg.id}
                        onPurchase={(id) => credit.purchasePackage(id, true)}
                        disabled={credit.purchasing !== null || pkg.already_purchased}
                        badge="LOOTBOX"
                        badgeEmoji="🎁"
                        savings={pkg.savings_percentage || 0}
                      />
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      ) : (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">
            Upgrade to Purchase Credits
          </h3>
          <p className="text-primary-700 mb-4">
            Credit purchases are available for Plus and Pro subscribers only.
          </p>
          <p className="text-sm text-primary-600 mb-4">
            Your current tier: <span className="font-semibold">{credit.creditInfo.subscriptionTier}</span>
          </p>
          <button
            onClick={() => window.location.href = '/subscription'}
            className="px-6 py-2 bg-primary-600 text-primary-foreground rounded-md hover:bg-primary-700 font-medium"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* How Credits Work Section */}
      <div className="mt-8 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl border border-primary/20 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-muted-foreground-900">How Credits Work</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground-900">1 Credit = 1 Enhancement</p>
                <p className="text-sm text-muted-foreground-600">Each credit powers one AI image enhancement in your moodboards</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground-900">Credits Never Expire</p>
                <p className="text-sm text-muted-foreground-600">Your purchased credits remain in your account indefinitely</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground-900">Monthly Allowance</p>
                <p className="text-sm text-muted-foreground-600">Free credits reset on the 1st of each month based on your subscription tier</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground-900">Instant Activation</p>
                <p className="text-sm text-muted-foreground-600">Purchased credits are added to your balance immediately</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-secondary-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground-900">AI-Powered</p>
                <p className="text-sm text-muted-foreground-600">Powered by advanced AI technology for professional-quality enhancements</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground-900">Moodboard Integration</p>
                <p className="text-sm text-muted-foreground-600">Use credits to enhance images in your creative moodboards</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-primary-200">
          <div className="flex items-center gap-2 text-sm text-primary-700">
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