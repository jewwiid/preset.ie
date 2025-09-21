"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditManager = void 0;
class CreditManager {
    constructor(supabase, alertService) {
        this.supabase = supabase;
        this.alertService = alertService;
    }
    async allocateMonthlyCredits() {
        const creditAllocations = {
            FREE: 5, // 5 credits per month
            PLUS: 50, // 50 credits per month
            PRO: 200 // 200 credits per month
        };
        // Reset monthly allowances for all users
        const { data: users } = await this.supabase
            .from('users_profile')
            .select('user_id, subscription_tier');
        for (const user of users || []) {
            const allowance = creditAllocations[user.subscription_tier] || 0;
            await this.supabase
                .from('user_credits')
                .upsert({
                user_id: user.user_id,
                subscription_tier: user.subscription_tier,
                monthly_allowance: allowance,
                current_balance: allowance,
                consumed_this_month: 0,
                last_reset_at: new Date().toISOString()
            });
        }
    }
    async checkAndConsumeCredits(userId, creditsNeeded, enhancementType) {
        // 1. Check user's personal credits first
        const userCredits = await this.getUserCredits(userId);
        if (userCredits.current_balance >= creditsNeeded) {
            return await this.consumeUserCredits(userId, creditsNeeded, enhancementType);
        }
        // 2. Check if user's tier allows platform credit usage
        if (userCredits.subscription_tier === 'free') {
            throw new Error('Insufficient credits. Upgrade to Plus or Pro for AI enhancements.');
        }
        // 3. Use platform pool credits
        return await this.consumePlatformCredits(userId, creditsNeeded, enhancementType);
    }
    async consumeUserCredits(userId, creditsNeeded, enhancementType) {
        const { data, error } = await this.supabase.rpc('consume_user_credits', {
            p_user_id: userId,
            p_credits: creditsNeeded,
            p_enhancement_type: enhancementType
        });
        if (error)
            throw new Error(`Credit consumption failed: ${error.message}`);
        return {
            source: 'user_credits',
            creditsConsumed: creditsNeeded,
            remainingBalance: data.remaining_balance,
            costUsd: 0 // User credits are pre-paid
        };
    }
    async consumePlatformCredits(userId, creditsNeeded, enhancementType) {
        // Check platform pool
        const { data: pool } = await this.supabase
            .from('credit_pools')
            .select('*')
            .eq('provider', 'nanobanan')
            .eq('status', 'active')
            .single();
        if (!pool || pool.available_balance < creditsNeeded) {
            // Try to auto-refill
            const refillSuccess = await this.autoRefillCredits('nanobanan');
            if (!refillSuccess) {
                throw new Error('Platform credits depleted. Please contact support.');
            }
        }
        // Consume from platform pool
        const costUsd = creditsNeeded * pool.cost_per_credit;
        await this.supabase.rpc('consume_platform_credits', {
            p_provider: 'nanobanan',
            p_credits: creditsNeeded,
            p_cost: costUsd
        });
        // Log transaction
        await this.logCreditTransaction({
            userId,
            transactionType: 'platform_deduction',
            creditsUsed: creditsNeeded,
            costUsd,
            provider: 'nanobanan',
            enhancementType
        });
        return {
            source: 'platform_pool',
            creditsConsumed: creditsNeeded,
            remainingBalance: pool.available_balance - creditsNeeded,
            costUsd
        };
    }
    async autoRefillCredits(provider) {
        try {
            const { data: pool } = await this.supabase
                .from('credit_pools')
                .select('*')
                .eq('provider', provider)
                .single();
            if (!pool)
                return false;
            // Purchase more credits from provider
            const purchaseResult = await this.purchaseCreditsFromProvider(provider, pool.auto_refill_amount);
            if (purchaseResult.success) {
                // Update pool
                await this.supabase
                    .from('credit_pools')
                    .update({
                    total_purchased: pool.total_purchased + pool.auto_refill_amount,
                    available_balance: pool.available_balance + pool.auto_refill_amount,
                    last_refill_at: new Date().toISOString()
                })
                    .eq('id', pool.id);
                await this.alertService?.notify({
                    type: 'credit_refill_success',
                    level: 'info',
                    message: `Successfully refilled ${pool.auto_refill_amount} credits for ${provider}`
                });
                return true;
            }
            return false;
        }
        catch (error) {
            await this.alertService?.notify({
                type: 'credit_refill_failed',
                level: 'error',
                message: `Failed to refill credits for ${provider}: ${error instanceof Error ? error.message : String(error)}`
            });
            return false;
        }
    }
    async purchaseCreditsFromProvider(provider, amount) {
        // This would integrate with provider's billing API
        // For now, simulate with manual admin approval
        const { data: config } = await this.supabase
            .from('api_providers')
            .select('*')
            .eq('name', provider)
            .single();
        if (!config)
            throw new Error(`Provider ${provider} not configured`);
        // In production, this would call the provider's billing API
        // For manual handling, create a purchase request
        await this.supabase
            .from('credit_purchase_requests')
            .insert({
            provider,
            amount_requested: amount,
            estimated_cost: amount * config.cost_per_request,
            status: 'pending_manual_approval',
            requested_at: new Date().toISOString()
        });
        // For auto-approval (if you have billing API integration)
        return { success: true, transactionId: `auto_${Date.now()}` };
    }
    async getUserCredits(userId) {
        const { data, error } = await this.supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error && error.code === 'PGRST116') {
            // User credits don't exist, create them
            return await this.initializeUserCredits(userId);
        }
        if (error)
            throw new Error(`Failed to fetch user credits: ${error.message}`);
        // Check if monthly reset is needed
        const lastReset = new Date(data.last_reset_at);
        const now = new Date();
        const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 +
            now.getMonth() - lastReset.getMonth();
        if (monthsSinceReset >= 1) {
            return await this.resetMonthlyCredits(userId);
        }
        return data;
    }
    async initializeUserCredits(userId) {
        const { data: profile } = await this.supabase
            .from('users_profile')
            .select('subscription_tier')
            .eq('user_id', userId)
            .single();
        const tier = profile?.subscription_tier || 'free';
        const allowances = { free: 0, plus: 10, pro: 25 };
        const allowance = allowances[tier] || 0;
        const { data, error } = await this.supabase
            .from('user_credits')
            .insert({
            user_id: userId,
            subscription_tier: tier,
            monthly_allowance: allowance,
            current_balance: allowance,
            consumed_this_month: 0,
            last_reset_at: new Date().toISOString()
        })
            .select()
            .single();
        if (error)
            throw new Error(`Failed to initialize user credits: ${error.message}`);
        return data;
    }
    async resetMonthlyCredits(userId) {
        const { data: currentCredits } = await this.supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', userId)
            .single();
        const allowance = currentCredits?.monthly_allowance || 0;
        const { data, error } = await this.supabase
            .from('user_credits')
            .update({
            current_balance: allowance,
            consumed_this_month: 0,
            last_reset_at: new Date().toISOString()
        })
            .eq('user_id', userId)
            .select()
            .single();
        if (error)
            throw new Error(`Failed to reset monthly credits: ${error.message}`);
        return data;
    }
    async logCreditTransaction(transaction) {
        await this.supabase
            .from('credit_transactions')
            .insert({
            user_id: transaction.userId,
            moodboard_id: transaction.moodboardId,
            transaction_type: transaction.transactionType,
            credits_used: transaction.creditsUsed,
            cost_usd: transaction.costUsd,
            provider: transaction.provider,
            enhancement_type: transaction.enhancementType,
            status: 'completed'
        });
    }
}
exports.CreditManager = CreditManager;
//# sourceMappingURL=CreditManager.js.map