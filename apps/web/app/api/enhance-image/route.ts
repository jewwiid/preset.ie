import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const nanoBananaApiKey = process.env.NANOBANANA_API_KEY || process.env.NANOBANAN_API_KEY!;

// Debug: Check if env vars are loaded
if (!supabaseUrl || !supabaseServiceKey || !nanoBananaApiKey) {
  console.error('Missing environment variables:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasNanoBananaKey: !!nanoBananaApiKey
  });
}

export async function POST(request: NextRequest) {
  console.log('Enhancement API called');
  
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create two clients: one for user auth, one for admin operations
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set the user's session to verify the token
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

    // Validate required fields
    if (!inputImageUrl || !enhancementType || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: inputImageUrl, enhancementType, prompt' },
        { status: 400 }
      );
    }

    // Check user credits using admin client
    let { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, subscription_tier')
      .eq('user_id', user.id)
      .single();

    // If user doesn't have credits record, create one
    if (creditsError && creditsError.code === 'PGRST116') {
      console.log('Creating user credits record for user:', user.id);
      
      // Get user's subscription tier from profile
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
        console.error('Failed to create user credits:', createError);
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

    // Debug logging
    console.log('User credits check:', {
      userId: user.id,
      userCredits,
      hasCredits: !!userCredits,
      currentBalance: userCredits?.current_balance,
      subscriptionTier: userCredits?.subscription_tier
    });

    // Check if user has enough credits
    if (!userCredits || userCredits.current_balance < 1) {
      console.log('Insufficient credits for user:', user.id, 'Balance:', userCredits?.current_balance);
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient credits. You have ${userCredits?.current_balance || 0} credits remaining. Please upgrade your plan or purchase more credits.`,
          code: 'INSUFFICIENT_CREDITS',
          currentBalance: userCredits?.current_balance || 0,
          subscriptionTier: userCredits?.subscription_tier || 'free'
        },
        { status: 402 }
      );
    }

    // Validate and optimize image URL
    let optimizedImageUrl = inputImageUrl;
    
    // Ensure URL is absolute and valid
    try {
      const urlObj = new URL(inputImageUrl);
      
      // Check if URL is accessible (not localhost unless in dev)
      if (process.env.NODE_ENV === 'production' && 
          (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
        console.error('Invalid URL for production:', inputImageUrl);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid image URL. Please use a publicly accessible URL.',
            details: 'Local URLs are not accessible to the enhancement service'
          },
          { status: 400 }
        );
      }
      
      // Apply optimization based on image source
      if (inputImageUrl.includes('unsplash.com')) {
        urlObj.searchParams.set('w', '1024');  // Limit to 1024px width
        urlObj.searchParams.set('q', '85');    // 85% quality
        urlObj.searchParams.set('fm', 'jpg');  // Use JPEG format
        urlObj.searchParams.set('fit', 'max'); // Maintain aspect ratio
        optimizedImageUrl = urlObj.toString();
        console.log('Optimized Unsplash URL:', optimizedImageUrl);
      } else if (inputImageUrl.includes('pexels.com')) {
        optimizedImageUrl = inputImageUrl.replace(/\?.*$/, '?auto=compress&cs=tinysrgb&w=1024');
        console.log('Optimized Pexels URL:', optimizedImageUrl);
      } else if (inputImageUrl.includes('images.pexels.com')) {
        // Direct Pexels image URLs
        optimizedImageUrl = inputImageUrl.includes('?') 
          ? inputImageUrl + '&auto=compress&cs=tinysrgb&w=1024'
          : inputImageUrl + '?auto=compress&cs=tinysrgb&w=1024';
        console.log('Optimized direct Pexels URL:', optimizedImageUrl);
      }
      
      // Log the final URL being sent
      console.log('Final image URL for NanoBanana:', optimizedImageUrl);
      
    } catch (urlError) {
      console.error('Invalid URL provided:', inputImageUrl, urlError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid image URL format',
          details: 'Please provide a valid absolute URL'
        },
        { status: 400 }
      );
    }

    // Handle data URLs (base64 images) - NanoBanana needs actual URLs
    if (optimizedImageUrl.startsWith('data:')) {
      console.error('Data URLs not supported directly');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Base64/data URLs are not supported',
          details: 'Please upload the image first or use a direct image URL',
          code: 'DATA_URL_NOT_SUPPORTED'
        },
        { status: 400 }
      );
    }
    
    // Prepare NanoBanana API payload according to official docs
    const enhancementPayload = {
      prompt: `${prompt} (Enhancement type: ${enhancementType}, Strength: ${strength})`,
      type: 'IMAGETOIAMGE', // Note: API uses IMAGETOIAMGE not IMAGETOIMAGE
      imageUrls: [optimizedImageUrl],  // Use optimized URL
      callBackUrl: process.env.NANOBANANA_CALLBACK_URL || 
        (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/nanobanana/callback` : 
         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/nanobanana/callback` : 
         'https://preset-51brxeczd-jewwiids-projects.vercel.app/api/nanobanana/callback'),
      numImages: 1
    };

    console.log('Sending to NanoBanana:', enhancementPayload);

    // Call NanoBanana API - official endpoint from docs
    let nanoBananaResponse;
    let nanoBananaData;
    
    try {
      nanoBananaResponse = await fetch('https://api.nanobananaapi.ai/api/v1/nanobanana/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nanoBananaApiKey}`
        },
        body: JSON.stringify(enhancementPayload)
      });

      nanoBananaData = await nanoBananaResponse.json();
    } catch (fetchError: any) {
      console.error('Failed to call NanoBanana API:', fetchError);
      
      // Check if it's a network error
      if (fetchError.message?.includes('fetch')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to connect to enhancement service',
            details: 'Network error or service temporarily unavailable',
            code: 'NETWORK_ERROR'
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enhancement service error',
          details: fetchError.message || 'Unknown error occurred',
          code: 'API_CALL_FAILED'
        },
        { status: 500 }
      );
    }
    
    // Debug logging
    console.log('NanoBanana API response:', JSON.stringify(nanoBananaData, null, 2));
    
    // Handle different response codes
    if (!nanoBananaResponse.ok || nanoBananaData.code !== 200) {
      console.error('NanoBanana API error:', nanoBananaData);
      
      // Handle specific error cases
      if (nanoBananaData.code === 402) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient credits in enhancement service',
            details: nanoBananaData.msg || 'Please contact support to add credits to your enhancement service account',
            code: 'ENHANCEMENT_SERVICE_CREDITS'
          },
          { status: 402 }
        );
      }
      
      // Check if error message indicates URL issue
      if (nanoBananaData.msg?.toLowerCase().includes('url') || 
          nanoBananaData.msg?.toLowerCase().includes('image') ||
          nanoBananaData.msg?.toLowerCase().includes('fetch')) {
        console.error('URL issue detected:', inputImageUrl);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Image URL not accessible',
            details: 'The enhancement service could not access the image. Please ensure the URL is publicly accessible and not behind authentication.',
            originalUrl: inputImageUrl,
            code: 'IMAGE_URL_INACCESSIBLE'
          },
          { status: 400 }
        );
      }
      
      // Check for invalid image format
      if (nanoBananaData.msg?.toLowerCase().includes('format') || 
          nanoBananaData.msg?.toLowerCase().includes('invalid')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid image format',
            details: 'Please use JPEG, PNG, or WebP images',
            code: 'INVALID_IMAGE_FORMAT'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enhancement service error',
          details: nanoBananaData.msg || 'Failed to submit enhancement task',
          code: nanoBananaData.code || 'ENHANCEMENT_ERROR'
        },
        { status: nanoBananaResponse.status }
      );
    }
    
    // Validate response structure for successful responses
    if (!nanoBananaData || !nanoBananaData.data || !nanoBananaData.data.taskId) {
      console.error('Invalid NanoBanana response structure:', nanoBananaData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response from enhancement service',
          details: 'Missing taskId in response',
          response: nanoBananaData
        },
        { status: 500 }
      );
    }
    
    // Store task in database using admin client
    const { data: task, error: taskError } = await supabaseAdmin
      .from('enhancement_tasks')
      .insert({
        id: nanoBananaData.data.taskId,
        user_id: user.id,
        moodboard_id: moodboardId,
        input_image_url: inputImageUrl,
        enhancement_type: enhancementType,
        prompt,
        strength,
        status: 'processing',
        api_task_id: nanoBananaData.data.taskId,
        cost_usd: 0.025,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (taskError) {
      console.error('Failed to store task:', taskError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to store enhancement task',
          details: taskError.message
        },
        { status: 500 }
      );
    }

    // Deduct credit using admin client
    await supabaseAdmin
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // Log transaction using admin client
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        moodboard_id: moodboardId,
        transaction_type: 'deduction',
        credits_used: 1,
        cost_usd: 0.025, // NanoBanana cost per request
        provider: 'nanobanana',
        api_request_id: nanoBananaData.data.taskId,
        enhancement_type: enhancementType,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      taskId: nanoBananaData.data.taskId,
      status: 'processing',
      message: 'Enhancement task submitted successfully. This may take 30-60 seconds.'
    });

  } catch (error: any) {
    console.error('Enhancement API error:', error);
    
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
    
    // Create two clients: one for user auth, one for admin operations
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error in GET:', authError);
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

    // Get task from database using admin client
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

    // Note: With callback-based approach, status updates happen via the callback handler
    // This endpoint just returns the current status from our database
    // The actual image processing and storage happens in the callback handler

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