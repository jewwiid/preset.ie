'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Check, X, Star, Zap, Crown, Sparkles } from 'lucide-react'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface SubscriptionPlan {
  id: string
  name: string
  tier: 'FREE' | 'PLUS' | 'PRO' | 'CREATOR'
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
    credits: 15,
    monthlyBumps: 0,
    prioritySupport: false,
    analytics: false,
    features: [
      '15 credits per month',
      'Basic marketplace access',
      'Community support',
      'Standard listing visibility',
      'Image generation only'
    ]
  },
  {
    id: 'plus',
    name: 'Plus',
    tier: 'PLUS',
    price: 9.99,
    period: 'month',
    credits: 150,
    monthlyBumps: 3,
    prioritySupport: true,
    analytics: false,
    popular: true,
    features: [
      '150 credits per month',
      '3 monthly listing bumps',
      'Priority support',
      'Voice-to-text transcription',
      'Standard video models',
      'Enhanced marketplace features',
      'Advanced search filters',
      'Direct messaging'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    tier: 'PRO',
    price: 24.99,
    period: 'month',
    credits: 500,
    monthlyBumps: 10,
    prioritySupport: true,
    analytics: true,
    features: [
      '500 credits per month',
      '10 monthly listing bumps',
      'Priority support',
      'Premium video models (Sora 2)',
      'Advanced analytics dashboard',
      'All marketplace features',
      'Custom branding options',
      'API access'
    ]
  },
  {
    id: 'creator',
    name: 'Creator',
    tier: 'CREATOR',
    price: 49.99,
    period: 'month',
    credits: 1500,
    monthlyBumps: 25,
    prioritySupport: true,
    analytics: true,
    features: [
      '1,500 credits per month',
      '25 monthly listing bumps',
      'Priority support',
      'Ultra-premium models (Sora 2 Pro)',
      'Advanced analytics',
      'All marketplace features',
      'Custom branding',
      'White-label solutions',
      'Dedicated account manager',
      'API access'
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
    if (!user || !supabase) return

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
      if (!supabase) {
        setError('Supabase client not initialized')
        return
      }

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
    if (!user || !supabase) return

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
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of Preset with our subscription plans.
            Get more credits, enhanced features, and priority support.
          </p>
        </div>

        {/* Current Plan Status */}
        {currentPlan !== 'FREE' && (
          <div className="mb-8 p-5 bg-card border border-primary/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-bloc">
                  Current Plan: {currentPlan}
                </h3>
                <p className="text-sm text-muted-foreground">
                  You're currently subscribed to the {currentPlan} plan
                </p>
              </div>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold transition-all"
              >
                {loading ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <X className="w-5 h-5 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            <p className="text-primary font-medium">{success}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-card rounded-xl shadow-sm border flex flex-col transition-all duration-200 hover:shadow-md ${
                plan.popular
                  ? 'border-primary scale-[1.02] shadow-md'
                  : 'border-border'
              } ${currentPlan === plan.tier ? 'ring-2 ring-primary/20' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold font-bloc uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              {currentPlan === plan.tier && (
                <div className="absolute -top-3 right-4 z-10">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold font-bloc uppercase tracking-wider">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center pt-8 pb-6 px-6 border-b border-border">
                <div className="flex justify-center mb-3">
                  {plan.tier === 'FREE' && <Star className="w-10 h-10 text-muted-foreground" />}
                  {plan.tier === 'PLUS' && <Zap className="w-10 h-10 text-primary" />}
                  {plan.tier === 'PRO' && <Crown className="w-10 h-10 text-primary" />}
                  {plan.tier === 'CREATOR' && <Sparkles className="w-10 h-10 text-primary" />}
                </div>
                <h3 className="text-xl font-bold mb-3">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground font-semibold">{plan.credits} credits per month</p>
              </div>

              {/* Features */}
              <div className="flex-grow p-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading || currentPlan === plan.tier}
                  className={`w-full py-3 px-6 rounded-lg font-bold font-bloc transition-all duration-200 ${
                    currentPlan === plan.tier
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : plan.popular
                      ? 'bg-primary text-primary-foreground hover:opacity-90 hover:shadow-lg'
                      : plan.tier === 'FREE'
                      ? 'bg-secondary text-secondary-foreground hover:bg-accent'
                      : 'bg-foreground text-background hover:opacity-90 hover:shadow-lg'
                  }`}
                >
                  {loading ? 'Processing...' :
                   currentPlan === plan.tier ? 'Current Plan' :
                   plan.price === 0 ? 'Stay on Free' :
                   !user ? 'Sign In to Upgrade' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-bold mb-2">
                What are credits used for?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Credits are used for AI image enhancements, premium marketplace features,
                and advanced tools. Each credit represents one enhancement or premium action.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-bold mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Yes! You can upgrade or downgrade your subscription at any time.
                Changes take effect immediately, and you'll be charged or credited accordingly.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-bold mb-2">
                What happens to unused credits?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
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
