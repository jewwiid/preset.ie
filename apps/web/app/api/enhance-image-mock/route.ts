import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Mock enhancement that applies a filter effect to demonstrate the flow
export async function POST(request: NextRequest) {
  console.log('Mock Enhancement API called');
  
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase clients
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const { 
      inputImageUrl, 
      enhancementType, 
      prompt, 
      strength = 0.8,
      moodboardId 
    } = await request.json();

    // Check user credits
    let { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!userCredits || userCredits.current_balance < 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient credits. You have ${userCredits?.current_balance || 0} credits remaining.`,
          code: 'INSUFFICIENT_CREDITS',
          currentBalance: userCredits?.current_balance || 0
        },
        { status: 402 }
      );
    }

    // Generate a mock task ID
    const taskId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store task in database
    await supabaseAdmin
      .from('enhancement_tasks')
      .insert({
        id: taskId,
        user_id: user.id,
        moodboard_id: moodboardId,
        input_image_url: inputImageUrl,
        enhancement_type: enhancementType,
        prompt,
        strength,
        status: 'processing',
        api_task_id: taskId,
        cost_usd: 0.025,
        created_at: new Date().toISOString()
      });

    // Deduct credit
    await supabaseAdmin
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // Log transaction
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        moodboard_id: moodboardId,
        transaction_type: 'deduction',
        credits_used: 1,
        cost_usd: 0.025,
        provider: 'mock',
        api_request_id: taskId,
        enhancement_type: enhancementType,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    // Simulate processing delay (complete after 5 seconds)
    setTimeout(async () => {
      // Create a mock enhanced URL by adding query parameters
      const enhancedUrl = `${inputImageUrl}${inputImageUrl.includes('?') ? '&' : '?'}enhanced=true&type=${enhancementType}&filter=${prompt.replace(/\s+/g, '_')}`;
      
      await supabaseAdmin
        .from('enhancement_tasks')
        .update({
          status: 'completed',
          result_url: enhancedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
    }, 5000);

    return NextResponse.json({
      success: true,
      taskId,
      status: 'processing',
      message: 'Mock enhancement task submitted. Will complete in 5 seconds.'
    });

  } catch (error: any) {
    console.error('Mock Enhancement API error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check task status
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }

    // Get task from database
    const { data: task, error: taskError } = await supabaseAdmin
      .from('enhancement_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        resultUrl: task.result_url,
        errorMessage: task.error_message,
        enhancementType: task.enhancement_type,
        prompt: task.prompt,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }
    });

  } catch (error: any) {
    console.error('Task status API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}