import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * NanoBanana Callback Handler
 * Receives async task completion notifications from NanoBanana API
 * Must respond within 15 seconds with HTTP 200
 */
export async function POST(request: NextRequest) {
  console.log('NanoBanana callback received');
  
  try {
    const payload = await request.json();
    console.log('Callback payload:', JSON.stringify(payload, null, 2));
    
    // Quick response to acknowledge receipt (within 15 seconds requirement)
    // Process heavy operations asynchronously
    setImmediate(async () => {
      await processCallback(payload);
    });
    
    // Respond immediately with 200 to acknowledge
    return NextResponse.json({ 
      success: true, 
      message: 'Callback received and processing' 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Callback processing error:', error);
    
    // Still return 200 to prevent retries if we have parsing issues
    return NextResponse.json({ 
      success: false, 
      error: 'Processing error, but acknowledged' 
    }, { status: 200 });
  }
}

async function processCallback(payload: any) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { code, data, msg } = payload;
    console.log('Callback data structure:', JSON.stringify(data, null, 2));
    
    // Try different possible field names for taskId
    const taskId = data?.taskId || data?.task_id || data?.id;
    
    if (!taskId) {
      console.error('No taskId in callback payload. Available fields:', Object.keys(data || {}));
      return;
    }
    
    console.log('Using taskId:', taskId);
    
    // Get the task from our database
    console.log('Looking for task with api_task_id:', taskId);
    let { data: task, error: taskError } = await supabaseAdmin
      .from('enhancement_tasks')
      .select('*')
      .eq('api_task_id', taskId)
      .single();
    
    if (taskError) {
      console.error('Error fetching task:', taskError);
      
      // Try looking by main id field as fallback
      console.log('Trying fallback lookup by main id field');
      const { data: fallbackTask, error: fallbackError } = await supabaseAdmin
        .from('enhancement_tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (fallbackError || !fallbackTask) {
        console.error('Task not found in either field:', taskId);
        return;
      }
      
      // Use fallback task
      task = fallbackTask;
    }
    
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }
    
    console.log('Found task:', task.id, 'Status:', task.status);
    
    // Update task based on callback status
    if (code === 200 && data?.info?.resultImageUrl) {
      // Success - download and store the image
      const resultUrl = data.info.resultImageUrl;
      
      console.log('Enhancement successful, result URL:', resultUrl);
      
      // Download the image promptly (URLs expire in 10 minutes)
      try {
        console.log('Downloading image from:', resultUrl);
        const imageResponse = await fetch(resultUrl);
        
        if (!imageResponse.ok) {
          console.error('Failed to download image:', imageResponse.status);
          throw new Error(`Failed to download: ${imageResponse.status}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        console.log('Downloaded image size:', imageBuffer.byteLength, 'bytes');
        
        // Store in Supabase Storage
        const fileName = `enhanced_${taskId}_${Date.now()}.jpg`;
        console.log('Uploading to bucket as:', fileName);
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('moodboard-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (uploadError) {
          console.error('Failed to store enhanced image:', uploadError);
          console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
          throw uploadError;
        }
        
        console.log('Upload successful:', uploadData);
        
        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('moodboard-images')
          .getPublicUrl(fileName);
        
        console.log('Public URL:', publicUrl);
        
        // Update task with success
        await supabaseAdmin
          .from('enhancement_tasks')
          .update({
            status: 'completed',
            result_url: publicUrl || resultUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);
        
        console.log('Task completed successfully:', taskId);
        
      } catch (downloadError) {
        console.error('Failed to download/store image:', downloadError);
        
        // Still mark as completed but use original URL
        await supabaseAdmin
          .from('enhancement_tasks')
          .update({
            status: 'completed',
            result_url: resultUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);
      }
      
    } else if (code === 400) {
      // Content policy violation
      await supabaseAdmin
        .from('enhancement_tasks')
        .update({
          status: 'failed',
          error_message: 'Content policy violation. Please rephrase your prompt.',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      // Refund the credit
      await refundCredit(supabaseAdmin, task.user_id);
      
    } else if (code === 500 || code === 501) {
      // Server error or generation failed
      await supabaseAdmin
        .from('enhancement_tasks')
        .update({
          status: 'failed',
          error_message: msg || 'Generation failed. Please try again.',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      // Refund the credit
      await refundCredit(supabaseAdmin, task.user_id);
      
    } else {
      // Unknown status
      console.error('Unknown callback status:', code, msg);
      
      await supabaseAdmin
        .from('enhancement_tasks')
        .update({
          status: 'failed',
          error_message: 'Unknown error occurred',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
    }
    
  } catch (error: any) {
    console.error('Async callback processing error:', error);
  }
}

async function refundCredit(supabaseAdmin: any, userId: string) {
  try {
    // Get user's current credits
    const { data: userCredits } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single();
    
    if (userCredits) {
      // Refund 1 credit
      await supabaseAdmin
        .from('user_credits')
        .update({
          current_balance: userCredits.current_balance + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      // Log the refund
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'refund',
          credits_used: -1,
          provider: 'nanobanana',
          status: 'completed',
          created_at: new Date().toISOString()
        });
      
      console.log('Credit refunded for user:', userId);
    }
  } catch (error) {
    console.error('Failed to refund credit:', error);
  }
}