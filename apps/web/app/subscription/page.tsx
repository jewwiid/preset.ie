'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Check, X, Star, Zap, Crown } from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  tier: 'FREE' | 'PLUS' | 'PRO'
  price: number
  period: 'month' | 'year'
  features: string[]
  popular?: boolean
  credits: number
  monthlyBumps: number
  prioritySupport: boolean
  analytics: boolean
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'FREE',
    price: 0,
    period: 'month',
    credits: 5,
    monthlyBumps: 0,
    prioritySupport: false,
    analytics: false,
    features: [
      '5 credits per month',
      'Basic marketplace access',
      'Community support',
      'Standard listing visibility'
    ]
  },
  {
    id: 'plus',
    name: 'Plus',
    tier: 'PLUS',
    price: 9.99,
    period: 'month',
    credits: 50,
    monthlyBumps: 3,
    prioritySupport: true,
    analytics: false,
    popular: true,
    features: [
      '50 credits per month',
      '3 monthly listing bumps',
      'Priority support',
      'Enhanced marketplace features',
      'Advanced search filters',
      'Direct messaging'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    tier: 'PRO',
    price: 29.99,
    period: 'month',
    credits: 200,
    monthlyBumps: 10,
    prioritySupport: true,
    analytics: true,
    features: [
      '200 credits per month',
      '10 monthly listing bumps',
      'Priority support',
      'Advanced analytics dashboard',
      'All marketplace features',
      'Custom branding options',
      'API access',
      'White-label solutions'
    ]
  }
]

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<string>('FREE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCurrentSubscription()
    }
  }, [user])

  const fetchCurrentSubscription = async () => {
    if (!user) return

    try {
      // Get the user's profile to get the subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('id, subscription_tier, subscription_status')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return
      }

      if (profile) {
        // Use the subscription tier from the profile directly
        setCurrentPlan(profile.subscription_tier || 'FREE')
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const handleUpgrade = async (planId: string) => {
    console.log('🔍 handleUpgrade called with planId:', planId)
    console.log('🔍 Current user:', user?.id, user?.email)
    
    if (!user) {
      console.log('❌ No user found, redirecting to sign in')
      // Redirect to sign in page
      window.location.href = '/auth/signin'
      return
    }

    if (planId === 'free') {
      setError('You are already on the free plan')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Get session for auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('🔍 Session check result:', { 
        hasSession: !!session, 
        sessionError: sessionError?.message,
        userId: session?.user?.id,
        expiresAt: session?.expires_at 
      })
      
      if (!session) {
        console.log('❌ No session found, redirecting to sign in')
        // If no session, redirect to sign in
        window.location.href = '/auth/signin'
        return
      }

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          packageId: planId,
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url

    } catch (error: any) {
      console.error('Error upgrading subscription:', error)
      setError(error.message || 'Failed to upgrade subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Update user profile to FREE tier
      const { error: profileUpdateError } = await supabase
        .from('users_profile')
        .update({ 
          subscription_tier: 'FREE',
          subscription_status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (profileUpdateError) {
        throw new Error(profileUpdateError.message)
      }

      setCurrentPlan('FREE')
      setSuccess('Subscription canceled successfully')
      
    } catch (error: any) {
      console.error('Error canceling subscription:', error)
      setError(error.message || 'Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground-900 mb-2">Sign in Required</h2>
          <p className="text-muted-foreground-600 mb-4">Please sign in to view subscription plans</p>
          <button 
            onClick={() => window.location.href = '/auth/signin'}
            className="px-4 py-2 bg-primary-600 text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-muted-foreground-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground-600 max-w-2xl mx-auto">
            Unlock the full potential of Preset with our subscription plans. 
            Get more credits, enhanced features, and priority support.
          </p>
        </div>

        {/* Current Plan Status */}
        {currentPlan !== 'FREE' && (
          <div className="mb-8 p-4 bg-primary-50 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-800">
                  Current Plan: {currentPlan}
                </h3>
                <p className="text-primary-600">
                  You're currently subscribed to the {currentPlan} plan
                </p>
              </div>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-4 py-2 bg-destructive-600 text-primary-foreground rounded-md hover:bg-destructive-700 disabled:opacity-50"
              >
                {loading ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-destructive-50 border border-destructive-200 rounded-md flex items-center gap-2">
            <X className="w-5 h-5 text-destructive-500" />
            <p className="text-destructive-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary/20 rounded-md flex items-center gap-2">
            <Check className="w-5 h-5 text-primary-500" />
            <p className="text-primary-700">{success}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-background rounded-2xl shadow-lg border-2 p-8 flex flex-col ${
                plan.popular 
                  ? 'border-primary-500 transform scale-105' 
                  : 'border-border-200'
              } ${currentPlan === plan.tier ? 'ring-2 ring-primary-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {currentPlan === plan.tier && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-primary-500 text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  {plan.tier === 'FREE' && <Star className="w-8 h-8 text-muted-foreground-400" />}
                  {plan.tier === 'PLUS' && <Zap className="w-8 h-8 text-primary-500" />}
                  {plan.tier === 'PRO' && <Crown className="w-8 h-8 text-primary-500" />}
                </div>
                <h3 className="text-2xl font-bold text-muted-foreground-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-muted-foreground-900 mb-2">
                  ${plan.price}
                  <span className="text-lg text-muted-foreground-500">/{plan.period}</span>
                </div>
                <p className="text-muted-foreground-600">{plan.credits} credits per month</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span className="text-muted-foreground-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading || currentPlan === plan.tier}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  currentPlan === plan.tier
                    ? 'bg-muted-100 text-muted-foreground-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-primary-600 text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
                    : 'bg-muted-900 text-primary-foreground hover:bg-muted-800 hover:shadow-lg'
                }`}
              >
                {loading ? 'Processing...' : 
                 currentPlan === plan.tier ? 'Current Plan' :
                 plan.price === 0 ? 'Stay on Free' : 
                 !user ? 'Sign In to Upgrade' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-muted-foreground-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-muted-foreground-900 mb-2">
                What are credits used for?
              </h3>
              <p className="text-muted-foreground-600">
                Credits are used for AI image enhancements, premium marketplace features, 
                and advanced tools. Each credit represents one enhancement or premium action.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-muted-foreground-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-muted-foreground-600">
                Yes! You can upgrade or downgrade your subscription at any time. 
                Changes take effect immediately, and you'll be charged or credited accordingly.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-muted-foreground-900 mb-2">
                What happens to unused credits?
              </h3>
              <p className="text-muted-foreground-600">
                Credits reset monthly and don't roll over. However, you can always 
                purchase additional credit packages if you need more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
