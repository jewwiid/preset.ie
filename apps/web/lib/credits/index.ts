/**
 * Centralized Credit Management Utilities
 *
 * This module provides helper functions for managing user credits,
 * ensuring consistent behavior across all API endpoints.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CREDIT_COSTS,
  OPERATION_COSTS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  REFUND_REASONS,
  ProviderType,
  TransactionType,
  RefundReason,
} from './constants';

export * from './constants';

/**
 * Credit operation result
 */
interface CreditOperationResult {
  success: boolean;
  newBalance?: number;
  error?: string;
  transactionId?: string;
}

/**
 * Refund user credits with comprehensive error handling and logging
 * Uses smart refund: restores to subscription credits first, then purchased credits
 *
 * @param supabaseAdmin - Supabase admin client
 * @param userId - User ID to refund
 * @param credits - Number of credits to refund
 * @param enhancementType - Type of operation being refunded
 * @param reason - Reason for refund
 * @returns Promise<boolean> - True if refund successful
 */
export async function refundUserCredits(
  supabaseAdmin: SupabaseClient,
  userId: string,
  credits: number,
  enhancementType: string,
  reason: string
): Promise<boolean> {
  console.log(`💰 Refunding ${credits} credit(s) to user ${userId}. Reason: ${reason}`);

  try {
    // Try to use the smart refund function
    const { data: refundResult, error: rpcError } = await supabaseAdmin.rpc('refund_user_credits', {
      p_user_id: userId,
      p_credits: credits,
      p_enhancement_type: enhancementType,
    });

    if (rpcError) {
      console.error('❌ Failed to refund credits via RPC:', rpcError);

      // Handle missing function gracefully
      if (rpcError.message?.includes('Could not find the function')) {
        console.log('⚠️ refund_user_credits function not found - using direct update');

        // Fallback to direct update
        const { data: userCredits } = await supabaseAdmin
          .from('user_credits')
          .select('current_balance, consumed_this_month')
          .eq('user_id', userId)
          .single();

        if (!userCredits) {
          console.error('❌ User credits not found');
          return false;
        }

        // Update credits directly (fallback - no smart refund)
        const { error: updateError } = await supabaseAdmin
          .from('user_credits')
          .update({
            current_balance: userCredits.current_balance + credits,
            consumed_this_month: Math.max(userCredits.consumed_this_month - credits, 0),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Failed to update credits:', updateError);
          return false;
        }

        // Log transaction
        await supabaseAdmin.from('credit_transactions').insert({
          user_id: userId,
          transaction_type: TRANSACTION_TYPES.REFUND,
          credits_used: credits,
          enhancement_type: enhancementType,
          status: TRANSACTION_STATUSES.COMPLETED,
          metadata: { reason },
        });

        console.log('✅ Credits refunded (fallback)');
        return true;
      }

      // Log alert for manual review for other errors
      try {
        await supabaseAdmin.from('system_alerts').insert({
          type: 'refund_failed',
          level: 'error',
          message: `Failed to refund ${credits} credits to user ${userId}`,
          metadata: { userId, credits, reason, error: rpcError.message },
        });
      } catch (alertError) {
        console.error('Failed to log refund alert:', alertError);
      }
      return false;
    }

    // RPC succeeded - refundResult contains breakdown
    const breakdown = refundResult as {
      total_refunded: number;
      subscription_refunded: number;
      purchased_refunded: number;
      new_balance: number;
      new_purchased_balance: number;
    };

    console.log(`✅ Credits refunded smartly:`, {
      total: breakdown.total_refunded,
      toSubscription: breakdown.subscription_refunded,
      toPurchased: breakdown.purchased_refunded,
      newBalance: breakdown.new_balance,
      newPurchasedBalance: breakdown.new_purchased_balance,
    });

    return true;
  } catch (err) {
    console.error('Exception during refund:', err);
    return false;
  }
}

/**
 * Validate user has sufficient credits before operation
 *
 * @param supabaseAdmin - Supabase admin client
 * @param userId - User ID to check
 * @param creditsNeeded - Number of credits required
 * @returns Promise<CreditOperationResult>
 */
export async function validateCreditBalance(
  supabaseAdmin: SupabaseClient,
  userId: string,
  creditsNeeded: number
): Promise<CreditOperationResult> {
  try {
    const { data: userCredits, error } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, consumed_this_month, subscription_tier')
      .eq('user_id', userId)
      .single();

    if (error || !userCredits) {
      return {
        success: false,
        error: 'Failed to fetch user credits',
      };
    }

    if (userCredits.current_balance < creditsNeeded) {
      return {
        success: false,
        error: `Insufficient credits. You need ${creditsNeeded} credit(s). You have ${userCredits.current_balance} credit(s) remaining.`,
        newBalance: userCredits.current_balance,
      };
    }

    return {
      success: true,
      newBalance: userCredits.current_balance,
    };
  } catch (err) {
    console.error('Error validating credit balance:', err);
    return {
      success: false,
      error: 'Failed to validate credit balance',
    };
  }
}

/**
 * Deduct credits from user with transaction logging
 * Uses smart consumption: purchased credits first, then subscription credits
 *
 * @param supabaseAdmin - Supabase admin client
 * @param userId - User ID to deduct from
 * @param credits - Number of credits to deduct
 * @param operationType - Type of operation
 * @param metadata - Additional metadata for transaction
 * @returns Promise<CreditOperationResult>
 */
export async function deductUserCredits(
  supabaseAdmin: SupabaseClient,
  userId: string,
  credits: number,
  operationType: string,
  metadata: Record<string, any> = {}
): Promise<CreditOperationResult> {
  console.log(`💸 Deducting ${credits} credit(s) from user ${userId}`);

  try {
    // Try to use the consume_user_credits RPC function (smart consumption)
    const { data: consumeResult, error: rpcError } = await supabaseAdmin.rpc('consume_user_credits', {
      p_user_id: userId,
      p_credits: credits,
    });

    if (rpcError) {
      console.error('❌ consume_user_credits RPC failed:', rpcError);

      // Fallback to direct update if function doesn't exist
      if (rpcError.message?.includes('Could not find the function')) {
        console.log('⚠️ consume_user_credits function not found - using direct update');

        // Get current balance
        const { data: userCredits, error: fetchError } = await supabaseAdmin
          .from('user_credits')
          .select('current_balance, consumed_this_month')
          .eq('user_id', userId)
          .single();

        if (fetchError || !userCredits) {
          return {
            success: false,
            error: 'Failed to fetch user credits',
          };
        }

        // Check sufficient balance
        if (userCredits.current_balance < credits) {
          return {
            success: false,
            error: 'Insufficient credits',
            newBalance: userCredits.current_balance,
          };
        }

        // Deduct credits (fallback - no smart consumption)
        const { error: updateError } = await supabaseAdmin
          .from('user_credits')
          .update({
            current_balance: userCredits.current_balance - credits,
            consumed_this_month: userCredits.consumed_this_month + credits,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Credit deduction failed:', updateError);
          return {
            success: false,
            error: 'Failed to deduct credits',
          };
        }

        const newBalance = userCredits.current_balance - credits;
        console.log(`✅ Credits deducted (fallback). New balance: ${newBalance}`);

        // Log transaction
        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            transaction_type: TRANSACTION_TYPES.DEDUCTION,
            credits_used: credits,
            enhancement_type: operationType,
            status: TRANSACTION_STATUSES.COMPLETED,
            metadata,
          });

        return {
          success: true,
          newBalance,
        };
      }

      // Other RPC errors
      return {
        success: false,
        error: rpcError.message || 'Failed to deduct credits',
      };
    }

    // RPC succeeded - consumeResult contains breakdown
    const breakdown = consumeResult as {
      total_consumed: number;
      purchased_consumed: number;
      subscription_consumed: number;
      remaining_balance: number;
      remaining_purchased: number;
    };

    console.log(`✅ Credits consumed smartly:`, {
      total: breakdown.total_consumed,
      fromPurchased: breakdown.purchased_consumed,
      fromSubscription: breakdown.subscription_consumed,
      remainingBalance: breakdown.remaining_balance,
      remainingPurchased: breakdown.remaining_purchased,
    });

    // Log transaction with breakdown
    const { data: transaction, error: logError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: TRANSACTION_TYPES.DEDUCTION,
        credits_used: credits,
        enhancement_type: operationType,
        status: TRANSACTION_STATUSES.COMPLETED,
        metadata: {
          ...metadata,
          consumption_breakdown: {
            purchased_consumed: breakdown.purchased_consumed,
            subscription_consumed: breakdown.subscription_consumed,
          },
        },
      })
      .select('id')
      .single();

    if (logError) {
      console.error('⚠️ Failed to log transaction:', logError);
    }

    return {
      success: true,
      newBalance: breakdown.remaining_balance,
      transactionId: transaction?.id,
    };
  } catch (err) {
    console.error('Exception during credit deduction:', err);
    return {
      success: false,
      error: 'Internal error during credit deduction',
    };
  }
}

/**
 * Add credits to user (for purchases, bonuses, etc.)
 *
 * @param supabaseAdmin - Supabase admin client
 * @param userId - User ID to add credits to
 * @param credits - Number of credits to add
 * @param transactionType - Type of transaction
 * @param metadata - Additional metadata
 * @returns Promise<CreditOperationResult>
 */
export async function addUserCredits(
  supabaseAdmin: SupabaseClient,
  userId: string,
  credits: number,
  transactionType: TransactionType = TRANSACTION_TYPES.ALLOCATION,
  metadata: Record<string, any> = {}
): Promise<CreditOperationResult> {
  console.log(`💰 Adding ${credits} credit(s) to user ${userId}`);

  try {
    // Get current balance
    const { data: userCredits, error: fetchError } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    if (fetchError || !userCredits) {
      return {
        success: false,
        error: 'Failed to fetch user credits',
      };
    }

    // Add credits
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({
        current_balance: userCredits.current_balance + credits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Credit addition failed:', updateError);
      return {
        success: false,
        error: 'Failed to add credits',
      };
    }

    // Log transaction
    const { data: transaction, error: logError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: transactionType,
        credits_used: credits,
        status: TRANSACTION_STATUSES.COMPLETED,
        metadata,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('⚠️  Failed to log transaction:', logError);
    }

    const newBalance = userCredits.current_balance + credits;
    console.log(`✅ Credits added successfully. New balance: ${newBalance}`);

    return {
      success: true,
      newBalance,
      transactionId: transaction?.id,
    };
  } catch (err) {
    console.error('Exception during credit addition:', err);
    return {
      success: false,
      error: 'Internal error during credit addition',
    };
  }
}

/**
 * Get credit cost for a provider
 *
 * @param provider - Provider name
 * @param imageCount - Number of images (default 1)
 * @returns Number of credits required
 */
export function getProviderCost(
  provider: ProviderType,
  imageCount: number = 1
): number {
  return CREDIT_COSTS[provider].userCredits * imageCount;
}

/**
 * Get provider cost details including platform credits
 *
 * @param provider - Provider name
 * @param imageCount - Number of images (default 1)
 * @returns Object with cost details
 */
export function getProviderCostDetails(
  provider: ProviderType,
  imageCount: number = 1
) {
  const providerCost = CREDIT_COSTS[provider];
  return {
    userCredits: providerCost.userCredits * imageCount,
    platformCredits: providerCost.platformCredits * imageCount,
    totalCostUsd: providerCost.totalCostUsd * imageCount,
    ratio: providerCost.ratio,
    provider,
  };
}
