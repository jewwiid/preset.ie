import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NanoBananaCallback {
  code: number;
  msg: string;
  data: {
    taskId: string;
    info: {
      resultImageUrl?: string;
    };
  };
}

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const callback: NanoBananaCallback = await req.json();
    const { code, msg, data } = callback;
    const { taskId, info } = data;
    
    console.log(`NanoBanana callback received for task ${taskId}:`, { code, msg });
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the task details from our database
    const { data: task, error: taskError } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (taskError || !task) {
      console.error('Task not found:', taskId);
      return new Response(JSON.stringify({ status: 'task_not_found' }), { 
        status: 200 // Still return 200 to acknowledge receipt
      });
    }
    
    // Handle different callback codes
    switch (code) {
      case 200: // Success
        await handleSuccess(supabase, task, info.resultImageUrl!);
        break;
        
      case 400: // Content policy violation
        await handleFailure(supabase, task, 'content_policy_violation', msg, true); // Refund
        break;
        
      case 500: // Internal error
        await handleFailure(supabase, task, 'internal_error', msg, true); // Refund
        break;
        
      case 501: // Generation failed
        await handleFailure(supabase, task, 'generation_failed', msg, true); // Refund
        break;
        
      default:
        await handleFailure(supabase, task, 'unknown_error', msg, true); // Refund
    }
    
    // Return 200 to confirm callback receipt
    return new Response(JSON.stringify({ status: 'received' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Callback processing error:', error);
    // Still return 200 to prevent retries if our processing fails
    return new Response(JSON.stringify({ status: 'error_logged' }), { 
      status: 200 
    });
  }
});

async function handleSuccess(
  supabase: any, 
  task: any, 
  resultImageUrl: string
) {
  console.log(`Task ${task.id} completed successfully`);
  
  try {
    // 1. Download and store the image
    const imageResponse = await fetch(resultImageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download result image');
    }
    
    const imageBlob = await imageResponse.blob();
    const fileName = `enhanced/${task.user_id}/${task.id}.jpg`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-media')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-media')
      .getPublicUrl(fileName);
    
    // 2. Update task status
    await supabase
      .from('enhancement_tasks')
      .update({
        status: 'completed',
        result_url: publicUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', task.id);
    
    // 3. Update moodboard if applicable
    if (task.moodboard_id && task.moodboard_item_index !== null) {
      await updateMoodboardWithEnhancement(
        supabase, 
        task.moodboard_id, 
        task.moodboard_item_index, 
        publicUrl
      );
    }
    
    // 4. Log successful transaction
    await supabase
      .from('credit_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('api_request_id', task.id);
    
    console.log(`Task ${task.id} processing complete`);
    
  } catch (error) {
    console.error('Error processing successful task:', error);
    // Even though generation succeeded, if we can't save it, we should refund
    await handleFailure(supabase, task, 'storage_error', 'Failed to save enhanced image', true);
  }
}

async function handleFailure(
  supabase: any, 
  task: any, 
  errorType: string, 
  errorMessage: string,
  shouldRefund: boolean
) {
  console.log(`Task ${task.id} failed: ${errorType} - ${errorMessage}`);
  
  try {
    // 1. Update task status
    await supabase
      .from('enhancement_tasks')
      .update({
        status: 'failed',
        error_message: errorMessage,
        error_type: errorType,
        failed_at: new Date().toISOString()
      })
      .eq('id', task.id);
    
    // 2. Process refund if needed
    if (shouldRefund) {
      await processRefund(supabase, task, errorType, errorMessage);
    }
    
    // 3. Update transaction status
    await supabase
      .from('credit_transactions')
      .update({
        status: 'failed',
        error_message: errorMessage,
        failed_at: new Date().toISOString()
      })
      .eq('api_request_id', task.id);
    
    // 4. Create alert for critical failures
    if (errorType === 'internal_error' || errorType === 'storage_error') {
      await supabase
        .from('platform_alerts')
        .insert({
          alert_type: 'enhancement_failure',
          severity: 'warning',
          message: `Enhancement failed for user ${task.user_id}: ${errorType}`,
          metadata: {
            task_id: task.id,
            error_type: errorType,
            error_message: errorMessage,
            refunded: shouldRefund
          }
        });
    }
    
  } catch (error) {
    console.error('Error handling task failure:', error);
  }
}

async function processRefund(
  supabase: any, 
  task: any, 
  reason: string,
  errorMessage: string
) {
  console.log(`Processing refund for task ${task.id}`);
  
  try {
    // 1. Get user's current balance
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', task.user_id)
      .single();
    
    if (creditsError) {
      console.error('Failed to get user credits for refund:', creditsError);
      return;
    }
    
    // 2. Refund the credit to user (always 1 credit from user perspective)
    const refundAmount = 1;
    const newBalance = userCredits.current_balance + refundAmount;
    const newConsumed = Math.max(0, userCredits.consumed_this_month - refundAmount);
    
    await supabase
      .from('user_credits')
      .update({
        current_balance: newBalance,
        consumed_this_month: newConsumed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', task.user_id);
    
    // 3. Create refund transaction record
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: task.user_id,
        moodboard_id: task.moodboard_id,
        transaction_type: 'refund',
        credits_used: -refundAmount, // Negative for refund
        provider: 'nanobanana',
        api_request_id: task.id,
        enhancement_type: task.enhancement_type,
        status: 'completed',
        metadata: {
          refund_reason: reason,
          original_task_id: task.id,
          error_message: errorMessage,
          refunded_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });
    
    // 4. Note: We don't refund NanoBanana credits to platform
    // NanoBanana already consumed them, this is a business loss
    // Log this for accounting
    await supabase
      .from('platform_credit_consumption')
      .insert({
        provider: 'nanobanana',
        user_id: task.user_id,
        operation_type: 'failed_enhancement_loss',
        user_credits_charged: 0, // User refunded
        provider_credits_consumed: 4, // But platform lost 4 credits
        task_id: task.id,
        moodboard_id: task.moodboard_id,
        metadata: {
          loss_reason: reason,
          refunded_to_user: true,
          business_loss: 4 // Platform absorbs the loss
        }
      });
    
    console.log(`Refund processed: User ${task.user_id} refunded ${refundAmount} credit`);
    
  } catch (error) {
    console.error('Error processing refund:', error);
    
    // Create critical alert if refund fails
    await supabase
      .from('platform_alerts')
      .insert({
        alert_type: 'refund_failed',
        severity: 'critical',
        message: `Failed to refund credit for task ${task.id}`,
        metadata: {
          task_id: task.id,
          user_id: task.user_id,
          error: error.message
        }
      });
  }
}

async function updateMoodboardWithEnhancement(
  supabase: any,
  moodboardId: string,
  itemIndex: number,
  enhancedUrl: string
) {
  try {
    // Get current moodboard
    const { data: moodboard, error } = await supabase
      .from('moodboards')
      .select('items')
      .eq('id', moodboardId)
      .single();
    
    if (error || !moodboard) {
      console.error('Failed to get moodboard:', error);
      return;
    }
    
    // Update the specific item
    const updatedItems = [...moodboard.items];
    if (updatedItems[itemIndex]) {
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        enhanced_url: enhancedUrl,
        enhanced_at: new Date().toISOString()
      };
    }
    
    // Save updated moodboard
    await supabase
      .from('moodboards')
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodboardId);
    
    console.log(`Moodboard ${moodboardId} updated with enhancement`);
    
  } catch (error) {
    console.error('Error updating moodboard:', error);
  }
}