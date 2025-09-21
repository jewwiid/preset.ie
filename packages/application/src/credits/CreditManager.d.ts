import { SupabaseClient } from '@supabase/supabase-js';
export interface CreditConsumptionResult {
    source: 'user_credits' | 'platform_pool';
    creditsConsumed: number;
    remainingBalance: number;
    costUsd: number;
}
export interface UserCredits {
    user_id: string;
    subscription_tier: string;
    monthly_allowance: number;
    current_balance: number;
    consumed_this_month: number;
    last_reset_at: string;
}
export interface CreditTransaction {
    userId: string;
    moodboardId?: string;
    transactionType: string;
    creditsUsed: number;
    costUsd: number;
    provider: string;
    enhancementType: string;
}
export declare class CreditManager {
    private supabase;
    private alertService?;
    constructor(supabase: SupabaseClient, alertService?: AlertService | undefined);
    allocateMonthlyCredits(): Promise<void>;
    checkAndConsumeCredits(userId: string, creditsNeeded: number, enhancementType: string): Promise<CreditConsumptionResult>;
    private consumeUserCredits;
    private consumePlatformCredits;
    autoRefillCredits(provider: string): Promise<boolean>;
    private purchaseCreditsFromProvider;
    getUserCredits(userId: string): Promise<UserCredits>;
    private initializeUserCredits;
    private resetMonthlyCredits;
    private logCreditTransaction;
}
export interface AlertService {
    notify(alert: {
        type: string;
        level: string;
        message: string;
    }): Promise<void>;
}
//# sourceMappingURL=CreditManager.d.ts.map