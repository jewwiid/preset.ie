import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  console.log('Enhanced Enhancement API called');
  
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
    const supabaseAnon = createSupabaseClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    
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
      moodboardId,
      provider = 'nanobanana' // Default to nanobanana
    } = await request.json();

    // Validate required fields
    if (!inputImageUrl || !enhancementType || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['nanobanana', 'seedream'].includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Get user credits
    let { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, subscription_tier, consumed_this_month')
      .eq('user_id', user.id)
      .single();

    // Create user credits record if doesn't exist
    if (creditsError && creditsError.code === 'PGRST116') {
      console.log('Creating user credits record for user:', user.id);
      
      const { data: profile } = await supabaseAdmin
        .from('users_profile')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      const tier = profile?.subscription_tier || 'free';
      const allowances: Record<string, number> = { free: 0, plus: 10, pro: 25 };
      const allowance = allowances[tier] || 0;

      const { data: newCredits, error: createError } = await supabaseAdmin
        .from('user_credits')
        .insert({
          user_id: user.id,
          subscription_tier: tier,
          monthly_allowance: allowance,
          current_balance: allowance,
          consumed_this_month: 0,
          last_reset_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user credits:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to initialize user credits' },
          { status: 500 }
        );
      }

      userCredits = newCredits;
    } else if (creditsError) {
      console.error('Error fetching user credits:', creditsError);
      return NextResponse.json(
        { success: false, error: 'Failed to check user credits' },
        { status: 500 }
      );
    }

    // Calculate cost based on provider
    const costPerEnhancement = provider === 'seedream' ? 2 : 1;
    
    // Check if user has enough credits
    if (!userCredits || userCredits.current_balance < costPerEnhancement) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient credits. You need ${costPerEnhancement} credit${costPerEnhancement !== 1 ? 's' : ''} for ${provider} enhancement. You have ${userCredits?.current_balance || 0} credits remaining.`,
          code: 'INSUFFICIENT_CREDITS',
          currentBalance: userCredits?.current_balance || 0,
          required: costPerEnhancement
        },
        { status: 402 }
      );
    }

    // Simplified image generation - just return success for now
    const imageGenService = {
      enhanceImage: async (imageUrl: string, prompt: string) => {
        // Mock enhancement - in production this would call the actual service
        return {
          success: true,
          enhancedImageUrl: imageUrl, // Return original for now
          creditsUsed: 1
        };
      },
      createTask: async (params: any) => {
        // Mock task creation - in production this would call the actual service
        return {
          taskId: `mock_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          success: true
        };
      }
    };

    // Create enhancement task in database
    const { data: task, error: taskError } = await supabaseAdmin
      .from('enhancement_tasks')
      .insert({
        user_id: user.id,
        moodboard_id: moodboardId,
        input_image_url: inputImageUrl,
        enhancement_type: enhancementType,
        prompt: prompt,
        strength: strength,
        status: 'pending',
        provider: provider,
        cost_credits: costPerEnhancement,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating enhancement task:', taskError);
      return NextResponse.json(
        { success: false, error: 'Failed to create enhancement task' },
        { status: 500 }
      );
    }

    try {
      // Submit task to provider
      const result = await imageGenService.createTask({
        mode: 'image-edit',
        prompt: prompt,
        imageUrls: [inputImageUrl],
        n: 1,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/imagegen/callback`,
        extras: {
          enhancementType,
          strength,
          size: provider === 'seedream' ? '2048*2048' : '1024*1024'
        }
      });

      // Update task with provider task ID
      await supabaseAdmin
        .from('enhancement_tasks')
        .update({
          provider_task_id: result.taskId,
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Deduct credits
      await supabaseAdmin.rpc('consume_user_credits', {
        p_user_id: user.id,
        p_credits: costPerEnhancement,
        p_enhancement_type: enhancementType
      });

      // Log credit transaction
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          moodboard_id: moodboardId,
          transaction_type: 'deduction',
          credits_used: costPerEnhancement,
          provider: provider,
          enhancement_type: enhancementType,
          status: 'completed'
        });

      console.log('Enhancement task created successfully:', {
        taskId: task.id,
        providerTaskId: result.taskId,
        provider: provider,
        cost: costPerEnhancement
      });

      return NextResponse.json({
        success: true,
        taskId: task.id,
        provider: provider,
        cost: costPerEnhancement,
        estimatedTime: provider === 'seedream' ? '2-5 seconds' : '30-60 seconds'
      });

    } catch (providerError) {
      console.error('Provider error:', providerError);
      
      // Update task as failed
      await supabaseAdmin
        .from('enhancement_tasks')
        .update({
          status: 'failed',
          error_message: providerError instanceof Error ? providerError.message : 'Provider error',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to submit enhancement task to provider',
          details: providerError instanceof Error ? providerError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Enhancement API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
