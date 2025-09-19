import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const nanoBananaApiKey = process.env.NANOBANANA_API_KEY || process.env.NANOBANAN_API_KEY!;
const PROVIDER = 'nanobanana';
const USER_CREDITS_PER_ENHANCEMENT = 1; // Users always see 1 credit

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
      moodboardId,
      selectedProvider = 'nanobanana' // Default to nanobanana for backward compatibility
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
      .select('current_balance, subscription_tier, consumed_this_month')
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

    // Check if user has enough credits (always 1 credit from user perspective)
    if (!userCredits || userCredits.current_balance < USER_CREDITS_PER_ENHANCEMENT) {
      console.log('Insufficient credits for user:', user.id, 'Balance:', userCredits?.current_balance);
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient credits. You need ${USER_CREDITS_PER_ENHANCEMENT} credit for enhancement. You have ${userCredits?.current_balance || 0} credits remaining.`,
          code: 'INSUFFICIENT_CREDITS',
          currentBalance: userCredits?.current_balance || 0,
          requiredCredits: USER_CREDITS_PER_ENHANCEMENT,
          subscriptionTier: userCredits?.subscription_tier || 'free'
        },
        { status: 402 }
      );
    }

    // Check if platform has enough credits with provider
    const { data: platformCredits } = await supabaseAdmin
      .rpc('check_platform_credits', { 
        p_provider: PROVIDER,
        p_user_credits: USER_CREDITS_PER_ENHANCEMENT 
      });
    
    if (!platformCredits) {
      console.error('Platform has insufficient NanoBanana credits');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enhancement service temporarily unavailable. Please try again later.',
          code: 'PLATFORM_CREDITS_LOW'
        },
        { status: 503 }
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
    // Use Supabase Edge Function for callback (no auth issues)
    const callbackUrl = process.env.NANOBANANA_CALLBACK_URL || 
      `${supabaseUrl}/functions/v1/nanobanana-callback`;
    
    // Verify callback URL is valid
    console.log('Callback URL configured:', callbackUrl);
    console.log('Using Supabase Edge Function for reliable callbacks');
    
    const enhancementPayload = {
      prompt: `${prompt} (Enhancement type: ${enhancementType}, Strength: ${strength})`,
      type: 'IMAGETOIAMGE', // Note: API uses IMAGETOIAMGE not IMAGETOIMAGE
      imageUrls: [optimizedImageUrl],  // Use optimized URL
      callBackUrl: callbackUrl,
      numImages: 1
    };

    console.log('Enhancement request:', {
      provider: selectedProvider,
      enhancementType,
      prompt: prompt.substring(0, 100) + '...',
      inputImageUrl: inputImageUrl.substring(0, 50) + '...'
    });

    let response;
    let responseData;
    let providerUsed = selectedProvider;
    
    try {
      if (selectedProvider === 'seedream') {
        // Use Seedream for enhancement
        console.log('Using Seedream for enhancement');
        response = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
          },
          body: JSON.stringify({
            prompt: `${enhancementType}: ${prompt}`,
            images: [inputImageUrl],
            size: '1024*1024',
            enable_base64_output: false,
            enable_sync_mode: false
          })
        });
        
        if (response.ok) {
          responseData = await response.json();
          // Handle Seedream async response pattern
          if (responseData.data?.id) {
            // Poll for results
            let attempts = 0;
            const maxAttempts = 30;
            
            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const resultResponse = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${responseData.data.id}/result`, {
                headers: {
                  'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
                }
              });
              
              if (resultResponse.ok) {
                const resultData = await resultResponse.json();
                if (resultData.data?.status === 'completed' && resultData.data?.outputs?.length > 0) {
                  responseData = {
                    code: 200,
                    data: {
                      generated_url: resultData.data.outputs[0]
                    }
                  };
                  break;
                }
              }
              attempts++;
            }
          }
        }
      } else {
        // Use NanoBanana (default) - official API format
        console.log('Using NanoBanana for enhancement');
        
        // Create callback URL for this request
        const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://preset.ie'}/api/nanobanana/callback`
        
        // Build request according to official API spec
        const nanobananaPayload = {
          prompt: `${enhancementType}: ${prompt}`,
          type: 'IMAGETOIAMGE', // Image editing mode
          callBackUrl: callbackUrl,
          numImages: 1,
          watermark: 'Preset',
          imageUrls: [inputImageUrl]
        };
        
        response = await fetch('https://api.nanobananaapi.ai/api/v1/nanobanana/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nanoBananaApiKey}`
          },
          body: JSON.stringify(nanobananaPayload)
        });
      }

      responseData = await response.json();
    } catch (fetchError: any) {
      console.error(`Failed to call ${selectedProvider} API:`, fetchError);
      
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
    console.log(`${providerUsed} API response:`, JSON.stringify(responseData, null, 2));
    
    // Handle different response codes
    if (!response.ok || responseData.code !== 200) {
      console.error(`${providerUsed} API error:`, responseData);
      
      // Handle specific error cases
      if (responseData.code === 402) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient credits in enhancement service',
            details: responseData.msg || 'Please contact support to add credits to your enhancement service account',
            code: 'ENHANCEMENT_SERVICE_CREDITS'
          },
          { status: 402 }
        );
      }
      
      // Check if error message indicates URL issue
      if (responseData.msg?.toLowerCase().includes('url') || 
          responseData.msg?.toLowerCase().includes('image') ||
          responseData.msg?.toLowerCase().includes('fetch')) {
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
      if (responseData.msg?.toLowerCase().includes('format') || 
          responseData.msg?.toLowerCase().includes('invalid')) {
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
          details: responseData.msg || 'Failed to submit enhancement task',
          code: responseData.code || 'ENHANCEMENT_ERROR'
        },
        { status: response.status }
      );
    }
    
    // Validate response structure for successful responses
    if (!responseData || !responseData.data || (!responseData.data.taskId && !responseData.data.generated_url)) {
      console.error(`Invalid ${providerUsed} response structure:`, responseData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response from enhancement service',
          details: 'Missing taskId in response',
          response: responseData
        },
        { status: 500 }
      );
    }
    
    // Handle response based on provider
    let enhancedImageUrl = null;
    let taskId = null;
    
    if (providerUsed === 'seedream') {
      // Seedream provides immediate results
      enhancedImageUrl = responseData.data?.generated_url || responseData.data?.outputs?.[0];
      taskId = responseData.data?.id || `task_${Date.now()}`;
    } else {
      // NanoBanana uses callbacks - we get taskId and wait for callback
      if (responseData.code !== 200) {
        throw new Error(`NanoBanana API error: ${responseData.msg || 'Unknown error'}`);
      }
      taskId = responseData.data?.taskId;
      if (!taskId) {
        throw new Error('No taskId received from NanoBanana API');
      }
      console.log('NanoBanana task submitted, waiting for callback:', taskId);
    }
    
    // Store task in database using admin client
    const { error: taskError } = await supabaseAdmin
      .from('enhancement_tasks')
      .insert({
        id: taskId,
        user_id: user.id,
        moodboard_id: moodboardId,
        input_image_url: inputImageUrl,
        enhancement_type: enhancementType,
        prompt,
        strength,
        status: enhancedImageUrl ? 'completed' : 'processing',
        api_task_id: taskId,
        provider: providerUsed,
        cost_usd: providerUsed === 'seedream' ? 0.05 : 0.025,
        created_at: new Date().toISOString()
      });

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

    // Deduct user credit (always 1 from user perspective)
    await supabaseAdmin
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - USER_CREDITS_PER_ENHANCEMENT,
        consumed_this_month: userCredits.consumed_this_month + USER_CREDITS_PER_ENHANCEMENT,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    // Consume platform credits (handles the provider-specific ratio internally)
    await supabaseAdmin.rpc('consume_platform_credits', {
      p_provider: providerUsed,
      p_user_id: user.id,
      p_user_credits: USER_CREDITS_PER_ENHANCEMENT,
      p_operation_type: enhancementType,
      p_task_id: taskId,
      p_moodboard_id: moodboardId
    });

    // Log transaction (user sees 1 credit, but we track the actual provider cost)
    // Provider ratios: NanoBanana 1:4, Seedream 1:2
    const providerCost = {
      userCredits: USER_CREDITS_PER_ENHANCEMENT,
      providerCredits: providerUsed === 'seedream' ? USER_CREDITS_PER_ENHANCEMENT * 2 : USER_CREDITS_PER_ENHANCEMENT * 4,
      ratio: providerUsed === 'seedream' ? 2 : 4
    };
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        moodboard_id: moodboardId,
        transaction_type: 'deduction',
        credits_used: USER_CREDITS_PER_ENHANCEMENT, // User perspective: 1 credit
        cost_usd: 0.10, // Actual cost for 4 NanoBanana credits
        provider: providerUsed,
        api_request_id: taskId,
        enhancement_type: enhancementType,
        status: enhancedImageUrl ? 'completed' : 'processing',
        metadata: {
          provider_credits_used: providerCost.providerCredits,
          credit_ratio: providerCost.ratio,
          provider: providerUsed
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      taskId: taskId,
      status: enhancedImageUrl ? 'completed' : 'processing',
      enhancedUrl: enhancedImageUrl,
      provider: providerUsed,
      message: enhancedImageUrl 
        ? `Enhancement completed successfully using ${providerUsed}` 
        : providerUsed === 'nanobanana'
          ? `Enhancement task submitted to NanoBanana. You will receive the result via callback within 30-60 seconds.`
          : `Enhancement task submitted successfully using ${providerUsed}. This may take 30-60 seconds.`
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