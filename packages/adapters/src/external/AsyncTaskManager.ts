import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NanoBananaService } from './NanoBananaService';
import { CreditManager } from '../../application/credits/CreditManager';

export interface EnhancementTask {
  id: string;
  user_id: string;
  moodboard_id?: string;
  input_image_url: string;
  enhancement_type: string;
  prompt: string;
  strength?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: string;
  api_task_id?: string;
  result_url?: string;
  cost_usd?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export class AsyncTaskManager {
  private nanoBananaService: NanoBananaService;
  private creditManager: CreditManager;

  constructor(
    private supabase: SupabaseClient,
    apiKey: string,
    callbackUrl: string = ''
  ) {
    this.nanoBananaService = new NanoBananaService(apiKey, callbackUrl);
    this.creditManager = new CreditManager(supabase);
  }

  async submitEnhancementTask(
    userId: string,
    inputImageUrl: string,
    enhancementType: string,
    prompt: string,
    strength: number = 0.8,
    moodboardId?: string
  ): Promise<{ taskId: string; status: string }> {
    try {
      // Check and consume credits before starting
      const creditResult = await this.creditManager.checkAndConsumeCredits(
        userId,
        1, // 1 credit per enhancement
        enhancementType
      );

      // Create task record
      const { data: task, error } = await this.supabase
        .from('enhancement_tasks')
        .insert({
          user_id: userId,
          moodboard_id: moodboardId,
          input_image_url: inputImageUrl,
          enhancement_type: enhancementType,
          prompt: prompt,
          strength: strength,
          status: 'pending',
          provider: 'nanobanan',
          cost_usd: creditResult.costUsd
        })
        .select()
        .single();

      if (error) {
        // Refund credits if task creation failed
        await this.refundCredits(userId, 1, enhancementType);
        throw new Error(`Failed to create task: ${error.message}`);
      }

      // Start processing asynchronously
      this.processTaskAsync(task.id);

      return {
        taskId: task.id,
        status: 'pending'
      };

    } catch (error) {
      console.error('Task submission error:', error);
      throw error;
    }
  }

  private async processTaskAsync(taskId: string): Promise<void> {
    try {
      // Update task status to processing
      await this.supabase
        .from('enhancement_tasks')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // Get task details
      const { data: task } = await this.supabase
        .from('enhancement_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (!task) {
        throw new Error('Task not found');
      }

      // Call WaveSpeed API (via NanoBananaService)
      const initialResult = await this.nanoBananaService.enhanceImage({
        imageUrl: task.input_image_url,
        enhancementType: task.enhancement_type as 'upscale' | 'style-transfer' | 'background-removal',
        style: task.prompt
      });

      // Update task with API task ID and set to processing
      await this.supabase
        .from('enhancement_tasks')
        .update({
          status: 'processing',
          api_task_id: initialResult.taskId,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // Wait for completion using the polling method
      try {
        const completedResult = await this.nanoBananaService.waitForTaskCompletion(initialResult.taskId);
        
        // Update task with final result
        await this.supabase
          .from('enhancement_tasks')
          .update({
            status: 'completed',
            result_url: completedResult.enhancedUrl,
            cost_usd: completedResult.cost,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);

        // Log successful transaction
        await this.creditManager.logCreditTransaction({
          userId: task.user_id,
          moodboardId: task.moodboard_id,
          transactionType: 'deduction',
          creditsUsed: 1,
          costUsd: completedResult.cost,
          provider: 'wavespeed',
          enhancementType: task.enhancement_type
        });
      } catch (pollingError) {
        // If polling fails, mark task as failed
        await this.supabase
          .from('enhancement_tasks')
          .update({
            status: 'failed',
            error_message: pollingError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);
        
        throw pollingError;
      }

    } catch (error) {
      console.error(`Task ${taskId} processing error:`, error);

      // Update task with error
      await this.supabase
        .from('enhancement_tasks')
        .update({
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // Refund credits for failed task
      const { data: task } = await this.supabase
        .from('enhancement_tasks')
        .select('user_id, enhancement_type')
        .eq('id', taskId)
        .single();

      if (task) {
        await this.refundCredits(task.user_id, 1, task.enhancement_type);
      }
    }
  }

  async getTaskStatus(taskId: string): Promise<EnhancementTask | null> {
    const { data: task, error } = await this.supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Failed to fetch task:', error);
      return null;
    }

    return task;
  }

  async getUserTasks(userId: string, limit: number = 10): Promise<EnhancementTask[]> {
    const { data: tasks, error } = await this.supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch user tasks:', error);
      return [];
    }

    return tasks || [];
  }

  private async refundCredits(
    userId: string, 
    credits: number, 
    enhancementType: string
  ): Promise<void> {
    try {
      // Add credits back to user
      await this.supabase.rpc('refund_user_credits', {
        p_user_id: userId,
        p_credits: credits,
        p_enhancement_type: enhancementType
      });

      // Log refund transaction
      await this.creditManager.logCreditTransaction({
        userId,
        transactionType: 'refund',
        creditsUsed: credits,
        costUsd: 0,
        provider: 'nanobanan',
        enhancementType
      });
    } catch (error) {
      console.error('Failed to refund credits:', error);
    }
  }

  // Background job to process pending tasks
  async processPendingTasks(): Promise<void> {
    const { data: pendingTasks } = await this.supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5); // Process 5 tasks at a time

    if (!pendingTasks || pendingTasks.length === 0) {
      return;
    }

    // Process tasks in parallel
    const promises = pendingTasks.map(task => this.processTaskAsync(task.id));
    await Promise.allSettled(promises);
  }

  // Clean up old completed tasks (older than 30 days)
  async cleanupOldTasks(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.supabase
      .from('enhancement_tasks')
      .delete()
      .eq('status', 'completed')
      .lt('created_at', thirtyDaysAgo.toISOString());
  }
}

// Database function for refunding credits
export const createRefundFunction = `
CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_enhancement_type VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
  -- Add credits back to user
  UPDATE user_credits
  SET 
    current_balance = current_balance + p_credits,
    consumed_this_month = GREATEST(consumed_this_month - p_credits, 0),
    lifetime_consumed = GREATEST(lifetime_consumed - p_credits, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log refund transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_used,
    enhancement_type,
    status
  ) VALUES (
    p_user_id,
    'refund',
    p_credits,
    p_enhancement_type,
    'completed'
  );
END;
$$ LANGUAGE plpgsql;
`;
