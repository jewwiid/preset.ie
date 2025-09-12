export interface UserCredits {
  id: string;
  user_id: string;
  subscription_tier: 'free' | 'plus' | 'pro';
  current_balance: number;
  monthly_allowance: number;
  consumed_this_month: number;
  lifetime_earned: number;
  lifetime_consumed: number;
  last_reset_at: string;
  last_purchase_at?: string;
  last_consumed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_eur: number;
  stripe_price_id: string;
  description: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'consume' | 'refund' | 'bonus' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  reference_id?: string;
  metadata?: any;
  created_at: string;
}

// Credit pricing constants
export const CREDIT_PACKAGES = {
  starter: {
    credits: 10,
    price_eur: 9.99,
    price_per_credit: 0.999
  },
  creative: {
    credits: 50,
    price_eur: 39.99,
    price_per_credit: 0.7998
  },
  pro: {
    credits: 100,
    price_eur: 69.99,
    price_per_credit: 0.6999
  },
  studio: {
    credits: 500,
    price_eur: 299.99,
    price_per_credit: 0.5998
  }
} as const;

// Calculate EUR value of credits
export function calculateCreditValue(credits: number): number {
  // Use average price per credit for display
  const avgPricePerCredit = 0.75;
  return credits * avgPricePerCredit;
}