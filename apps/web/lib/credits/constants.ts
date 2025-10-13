/**
 * Centralized Credit System Constants
 *
 * This file contains all credit-related constants to ensure consistency
 * across all API endpoints and prevent pricing discrepancies.
 */

export const CREDIT_COSTS = {
  nanobanana: {
    userCredits: 1, // Credits charged to user
    platformCredits: 4, // Actual API credits consumed
    costUsd: 0.025, // Cost per platform credit
    totalCostUsd: 0.10, // Total cost for user (4 * 0.025)
    ratio: 4, // Platform to user credit ratio
  },
  seedream: {
    userCredits: 2, // Credits charged to user
    platformCredits: 2, // Actual API credits consumed
    costUsd: 0.05, // Cost per platform credit
    totalCostUsd: 0.10, // Total cost for user (2 * 0.05)
    ratio: 1, // Platform to user credit ratio
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
   * Fixed cost regardless of provider
   */
  videoGeneration: 5,

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
  free: 5,
  plus: 50,
  pro: 200,
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
