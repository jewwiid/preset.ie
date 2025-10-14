/**
 * Centralized Credit System Constants
 *
 * This file contains all credit-related constants to ensure consistency
 * across all API endpoints and prevent pricing discrepancies.
 */

export const CREDIT_COSTS = {
  nanobanana: {
    userCredits: 2, // Credits charged to user
    platformCredits: 2, // Actual API credits consumed ($0.038 API cost)
    costUsd: 0.019, // Actual API cost per image ($0.038 / 2 credits)
    totalCostUsd: 0.038, // Total API cost ($0.038)
    chargeUsd: 0.04, // What we charge user (2 * $0.02)
    ratio: 1, // Platform to user credit ratio
    margin: 0.05, // Profit margin: 5% ($0.04 - $0.038 = $0.002)
  },
  seedream: {
    userCredits: 2, // Credits charged to user
    platformCredits: 2, // Actual API credits consumed ($0.027 API cost)
    costUsd: 0.0135, // Actual API cost per image ($0.027 / 2 credits)
    totalCostUsd: 0.027, // Total API cost ($0.027)
    chargeUsd: 0.04, // What we charge user (2 * $0.02)
    ratio: 1, // Platform to user credit ratio
    margin: 0.48, // Profit margin: 48% ($0.04 - $0.027 = $0.013)
  },
} as const;

export type ProviderType = keyof typeof CREDIT_COSTS;

export const OPERATION_COSTS = {
  /**
   * Cost for generating an image
   * @param provider - 'nanobanana' or 'seedream'
   * @returns User credits required
   */
  generation: (provider: ProviderType = 'seedream') =>
    CREDIT_COSTS[provider].userCredits,

  /**
   * Cost for enhancing an image
   * @param provider - 'nanobanana' or 'seedream'
   * @returns User credits required
   */
  enhancement: (provider: ProviderType = 'nanobanana') =>
    CREDIT_COSTS[provider].userCredits,

  /**
   * Cost for applying a style to an image
   * Fixed cost regardless of provider
   */
  styleApplication: 1,

  /**
   * Cost for generating a video
   * Based on provider and model tier
   */
  videoGeneration: (provider: 'seedance' | 'wan' = 'seedance') => {
    const VIDEO_COSTS = {
      seedance: 12, // bytedance/seedance-v1-pro-i2v-720p ($0.15 API cost, 60% margin)
      wan: 20, // wan-2.5/image-to-video ($0.25 API cost, 60% margin)
    };
    return VIDEO_COSTS[provider];
  },

  /**
   * Cost for batch editing
   * @param imageCount - Number of images to edit
   * @param provider - 'nanobanana' or 'seedream'
   */
  batchEdit: (imageCount: number, provider: ProviderType = 'seedream') =>
    imageCount * CREDIT_COSTS[provider].userCredits,
} as const;

/**
 * Subscription tier credit allowances
 */
export const SUBSCRIPTION_ALLOWANCES = {
  free: 15,
  plus: 150,
  pro: 500,
  creator: 1500,
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_ALLOWANCES;

/**
 * Referral credit rewards
 */
export const REFERRAL_CREDITS = {
  referrerBonus: 5, // Credits given to referrer when referred user completes profile
  referredBonus: 10, // Welcome bonus for referred user
} as const;

/**
 * Credit transaction types
 */
export const TRANSACTION_TYPES = {
  DEDUCTION: 'deduction',
  REFUND: 'refund',
  ALLOCATION: 'allocation',
  PURCHASE: 'purchase',
  REFERRAL_BONUS: 'referral_bonus',
  MANUAL_ADJUSTMENT: 'manual_adjustment',
  SUBSCRIPTION_RENEWAL: 'subscription_renewal',
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

/**
 * Credit transaction statuses
 */
export const TRANSACTION_STATUSES = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  PENDING: 'pending',
  REFUNDED: 'refunded',
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUSES[keyof typeof TRANSACTION_STATUSES];

/**
 * Refund reasons
 */
export const REFUND_REASONS = {
  API_FAILURE: 'api_failure',
  NETWORK_ERROR: 'network_error',
  INVALID_RESPONSE: 'invalid_response',
  DATABASE_ERROR: 'database_error',
  TIMEOUT: 'timeout',
  USER_REQUEST: 'user_request',
  SYSTEM_ERROR: 'system_error',
  TASK_FAILURE: 'task_failure',
} as const;

export type RefundReason = typeof REFUND_REASONS[keyof typeof REFUND_REASONS];
