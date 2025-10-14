'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CreditInfo {
  packages: any[];
  platformCapacity: any;
  currentBalance: number;
  monthlyAllowance: number;
  consumedThisMonth: number;
  subscriptionTier: string;
  canPurchase: boolean;
  lastResetAt?: string;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
}

interface UserProfile {
  display_name: string;
  handle: string;
  avatar_url?: string;
}

interface UseCreditPurchaseOptions {
  userId?: string;
  onPurchaseComplete?: () => void;
}

export function useCreditPurchase({ userId, onPurchaseComplete }: UseCreditPurchaseOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch credit information
  const fetchCreditInfo = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        setError('Database connection not available. Please try again.');
        return;
      }

      const session = await supabase.auth.getSession();
      if (!session.data.session) throw new Error('No session');

      // Get packages and platform capacity with cache busting
      const packagesResponse = await fetch(`/api/credits/purchase?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`
        }
      });

      const packagesData = await packagesResponse.json();

      if (packagesData.error) {
        setError(packagesData.error);
        return;
      }

      // Get user's current credit balance
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('current_balance, monthly_allowance, consumed_this_month, subscription_tier, last_reset_at')
        .eq('user_id', userId)
        .single();

      // Get user profile
      const { data: profile } = await supabase
        .from('users_profile')
        .select('subscription_tier, display_name, handle, avatar_url, subscription_started_at, subscription_expires_at')
        .eq('user_id', userId)
        .single();

      const subscriptionTier = profile?.subscription_tier || 'FREE';
      const canPurchase = subscriptionTier === 'PLUS' || subscriptionTier === 'PRO';

      setCreditInfo({
        packages: packagesData.packages,
        platformCapacity: packagesData.platformCapacity,
        currentBalance: userCredits?.current_balance || 0,
        monthlyAllowance: userCredits?.monthly_allowance || 0,
        consumedThisMonth: userCredits?.consumed_this_month || 0,
        subscriptionTier,
        canPurchase,
        lastResetAt: userCredits?.last_reset_at,
        subscriptionStartedAt: profile?.subscription_started_at,
        subscriptionExpiresAt: profile?.subscription_expires_at
      });

      setUserProfile({
        display_name: profile?.display_name || 'User',
        handle: profile?.handle || 'user',
        avatar_url: profile?.avatar_url
      });
    } catch (err: any) {
      console.error('Error fetching credit info:', err);
      setError('Failed to load credit information');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Purchase function for regular credit packages
  const purchasePackage = useCallback(async (packageId: string) => {
    if (!userId) return;

    setPurchasing(packageId);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase) {
        setError('Database connection not available. Please try again.');
        return;
      }

      const session = await supabase.auth.getSession();
      if (!session.data.session) throw new Error('No session');

      // Find the package
      const selectedPackage = creditInfo?.packages?.find((pkg: any) => pkg.id === packageId);

      if (!selectedPackage) {
        setError('Package not found');
        return;
      }

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-credit-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          successUrl: `${window.location.origin}/credits/purchase?success=true`,
          cancelUrl: `${window.location.origin}/credits/purchase?canceled=true`
        })
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        toast.loading('Redirecting to checkout...', {
          description: 'Please complete your purchase'
        });
        window.location.href = data.url;
      } else {
        const errorMessage = data.error || 'Failed to create checkout session';
        setError(errorMessage);
        setPurchasing(null);
        toast.error('Purchase failed', {
          description: errorMessage
        });
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      const errorMessage = 'Failed to complete purchase';
      setError(errorMessage);
      setPurchasing(null);
      toast.error('Purchase failed', {
        description: errorMessage
      });
    }
  }, [userId, creditInfo]);


  // Auto-fetch on mount
  useEffect(() => {
    if (userId) {
      fetchCreditInfo();
    }
  }, [userId, fetchCreditInfo]);

  return {
    // State
    loading,
    purchasing,
    creditInfo,
    userProfile,
    error,
    success,

    // Actions
    fetchCreditInfo,
    purchasePackage,
    setError,
    setSuccess,
  };
}
