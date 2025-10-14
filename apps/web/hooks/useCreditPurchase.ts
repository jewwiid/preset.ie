'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface CreditInfo {
  packages: any[];
  lootboxPackages: any[];
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
      const packagesResponse = await fetch(`/api/credits/purchase?t=${Date.now()}&include_lootbox=false`, {
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

  // Generic purchase function (works for both regular and lootbox)
  const purchasePackage = useCallback(async (packageId: string, isLootbox: boolean = false) => {
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
      const packages = isLootbox ? creditInfo?.lootboxPackages : creditInfo?.packages;
      const selectedPackage = packages?.find((pkg: any) => pkg.id === packageId);

      if (!selectedPackage) {
        setError(`${isLootbox ? 'Lootbox' : 'Package'} not found`);
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
          successUrl: `${window.location.origin}/credits/purchase?success=true${isLootbox ? '&lootbox=true' : ''}`,
          cancelUrl: `${window.location.origin}/credits/purchase?canceled=true`
        })
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
        setPurchasing(null);
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(`Failed to complete ${isLootbox ? 'lootbox' : ''} purchase`);
      setPurchasing(null);
    }
  }, [userId, creditInfo]);

  // Check lootbox availability
  const checkLootboxAvailability = useCallback(async () => {
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

      const response = await fetch(`/api/lootbox/availability?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to check lootbox availability');
      }

      // Update only the lootbox packages
      setCreditInfo((prev) => prev ? {
        ...prev,
        lootboxPackages: data.lootbox.available_packages || []
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check lootbox availability');
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
    checkLootboxAvailability,
    setError,
    setSuccess,
  };
}
