import { SupabaseClient } from '@supabase/supabase-js';

export interface CreditBalance {
  userId: string;
  currentBalance: number;
  monthlyAllowance: number;
  lastRefreshed: Date;
}

export interface CreditTransaction {
  userId: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  metadata?: Record<string, any>;
}

export class CreditManager {
  constructor(private supabase: SupabaseClient) {}

  async getUserCredits(userId: string): Promise<CreditBalance | null> {
    const { data, error } = await this.supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      userId: data.user_id,
      currentBalance: data.current_balance,
      monthlyAllowance: data.monthly_allowance,
      lastRefreshed: new Date(data.last_refreshed)
    };
  }

  async deductCredits(userId: string, amount: number, description: string): Promise<boolean> {
    // Start a transaction
    const { data: currentCredits } = await this.supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    if (!currentCredits || currentCredits.current_balance < amount) {
      return false; // Insufficient credits
    }

    // Deduct credits
    const { error: updateError } = await this.supabase
      .from('user_credits')
      .update({ 
        current_balance: currentCredits.current_balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) return false;

    // Log transaction
    await this.logTransaction({
      userId,
      amount,
      type: 'debit',
      description
    });

    return true;
  }

  async addCredits(userId: string, amount: number, description: string): Promise<boolean> {
    const { data: currentCredits } = await this.supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    if (!currentCredits) return false;

    const { error } = await this.supabase
      .from('user_credits')
      .update({ 
        current_balance: currentCredits.current_balance + amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) return false;

    await this.logTransaction({
      userId,
      amount,
      type: 'credit',
      description
    });

    return true;
  }

  async checkPlatformCredits(): Promise<number> {
    const { data } = await this.supabase
      .from('platform_credits')
      .select('available_credits')
      .eq('provider', 'nanobanana')
      .single();

    return data?.available_credits || 0;
  }

  async deductPlatformCredits(amount: number): Promise<boolean> {
    const { data: current } = await this.supabase
      .from('platform_credits')
      .select('available_credits')
      .eq('provider', 'nanobanana')
      .single();

    if (!current || current.available_credits < amount) return false;

    const { error } = await this.supabase
      .from('platform_credits')
      .update({ 
        available_credits: current.available_credits - amount,
        last_used: new Date().toISOString()
      })
      .eq('provider', 'nanobanana');

    return !error;
  }

  private async logTransaction(transaction: CreditTransaction): Promise<void> {
    await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        metadata: transaction.metadata || {},
        created_at: new Date().toISOString()
      });
  }
}