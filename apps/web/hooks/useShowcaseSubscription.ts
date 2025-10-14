import { useState, useCallback } from 'react';

interface ShowcaseSubscriptionOptions {
  accessToken?: string;
}

export function useShowcaseSubscription({ accessToken }: ShowcaseSubscriptionOptions = {}) {
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<string>('FREE');
  const [monthlyShowcaseCount, setMonthlyShowcaseCount] = useState<number>(0);

  const fetchUserProfile = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserSubscriptionTier(data.subscription_tier || 'FREE');
        setMonthlyShowcaseCount(data.monthly_showcase_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, [accessToken]);

  const getMaxShowcases = useCallback(() => {
    switch (userSubscriptionTier) {
      case 'FREE':
        return 3;
      case 'PLUS':
        return 10;
      case 'PRO':
        return -1; // unlimited
      default:
        return 0;
    }
  }, [userSubscriptionTier]);

  const canCreateShowcase = useCallback(() => {
    const maxShowcases = getMaxShowcases();
    return maxShowcases === -1 || monthlyShowcaseCount < maxShowcases;
  }, [monthlyShowcaseCount, getMaxShowcases]);

  return {
    userSubscriptionTier,
    monthlyShowcaseCount,
    fetchUserProfile,
    getMaxShowcases,
    canCreateShowcase,
  };
}
