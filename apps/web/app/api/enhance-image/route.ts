import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendAPIFailureAlert,
  analyzeAPIError,
  alertCreditsExhausted,
  alertAPIError,
  alertTimeout
} from '../../../lib/api-failure-alerts';
import { CREDIT_COSTS, OPERATION_COSTS, ProviderType } from '@/lib/credits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const nanoBananaApiKey = process.env.NANOBANANA_API_KEY || process.env.NANOBANAN_API_KEY!;
const PROVIDER: ProviderType = 'nanobanana';
const USER_CREDITS_PER_ENHANCEMENT = OPERATION_COSTS.enhancement(PROVIDER);

// Debug: Check if env vars are loaded
if (!supabaseUrl || !supabaseServiceKey || !nanoBananaApiKey) {
  console.error('Missing environment variables:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasNanoBananaKey: !!nanoBananaApiKey
  });
}

// Helper function to get image dimensions from URL
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  try {
    // For browser environment, we'd use Image object, but in Node/Edge we need to fetch and decode
    // For now, try to extract from URL parameters if available (e.g., Unsplash)
    const url = new URL(imageUrl)

    // Try to get dimensions from URL params (common for CDN services)
    const width = url.searchParams.get('w') || url.searchParams.get('width')
    const height = url.searchParams.get('h') || url.searchParams.get('height')

    if (width && height) {
      return { width: parseInt(width), height: parseInt(height) }
    }

    // If not in URL, fetch the image and check headers
    const response = await fetch(imageUrl, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')

    if (!contentType?.startsWith('image/')) {
      throw new Error('Not an image')
    }

    // If we can't get dimensions easily, return a default that maintains common ratios
    // We'll fetch actual pixels by downloading the image
    const imgResponse = await fetch(imageUrl)
    const buffer = await imgResponse.arrayBuffer()

    // Simple dimension detection for common formats
    const view = new DataView(buffer)

    // JPEG
    if (view.getUint16(0) === 0xFFD8) {
      let offset = 2
      while (offset < view.byteLength) {
        if (view.getUint8(offset) !== 0xFF) break
        const marker = view.getUint8(offset + 1)
        if (marker === 0xC0 || marker === 0xC2) {
          return {
            height: view.getUint16(offset + 5),
            width: view.getUint16(offset + 7)
          }
        }
        offset += 2 + view.getUint16(offset + 2)
      }
    }

    // PNG
    if (view.getUint32(0) === 0x89504E47) {
      return {
        width: view.getUint32(16),
        height: view.getUint32(20)
      }
    }

    throw new Error('Could not determine image dimensions')
  } catch (error) {
    console.error('Error getting image dimensions:', error)
    throw error
  }
}

// Helper function to refund credits on failures
async function refundUserCredits(
  supabaseAdmin: any,
  userId: string,
  credits: number,
  enhancementType: string,
  reason: string
) {
  console.log(`💰 Refunding ${credits} credit(s) to user ${userId}. Reason: ${reason}`);
  
  try {
    const { error } = await supabaseAdmin.rpc('refund_user_credits', {
      p_user_id: userId,
      p_credits: credits,
      p_enhancement_type: enhancementType
    });

    if (error) {
      console.error('❌ Failed to refund credits:', error);
      
      // Handle missing function gracefully
      if (error.message?.includes('Could not find the function')) {
        console.log('⚠️  refund_user_credits function not found in database - continuing without refund');
        return true; // Don't treat this as a failure
      }
      
      // Log alert for manual review for other errors
      try {
        await supabaseAdmin
          .from('system_alerts')
          .insert({
            type: 'refund_failed',
            level: 'error',
            message: `Failed to refund ${credits} credits to user ${userId}`,
            metadata: { userId, credits, reason, error: error.message }
          });
      } catch (alertError) {
        console.error('Failed to log refund alert:', alertError);
      }
      return false;
    } else {
      console.log('✅ Credits refunded successfully');
      return true;
    }
  } catch (err) {
    console.error('Exception during refund:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  console.log('Enhancement API called');
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Parse request body FIRST to avoid "Body has already been read" error
    let requestBody;
    try {
      console.log('Attempting to parse request body...');
      
      // Try to get the body as text first to see if it's readable
      const bodyText = await request.text();
      console.log('Body as text length:', bodyText.length);
      
      if (!bodyText) {
        throw new Error('Empty request body');
      }
      
      // Parse the JSON
      requestBody = JSON.parse(bodyText);
      console.log('Request body parsed successfully:', Object.keys(requestBody));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      console.error('Parse error details:', {
        message: parseError instanceof Error ? parseError.message : 'Unknown error',
        stack: parseError instanceof Error ? parseError.stack : undefined
      });
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parseError instanceof Error ? parseError.message : 'Unknown parse error' },
        { status: 400 }
      );
    }

    const { 
      inputImageUrl, 
      enhancementType, 
      prompt, 
      strength = 0.8,
      moodboardId,
      selectedProvider = 'nanobanana' // Default to nanobanana for backward compatibility
    } = requestBody;

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

    // TODO: Implement proper platform credits check
    // For now, we'll skip this check since the platform_credits table doesn't exist yet
    // const { data: platformCredits } = await supabaseAdmin
    //   .rpc('check_platform_credits', { 
    //     p_provider: selectedProvider,
    //     p_user_credits: USER_CREDITS_PER_ENHANCEMENT 
    //   });
    
    // if (!platformCredits) {
    //   console.error(`Platform has insufficient ${selectedProvider} credits`);
    //   return NextResponse.json(
    //     { 
    //       success: false, 
    //       error: 'Enhancement service temporarily unavailable. Please try again later.',
    //       code: 'PLATFORM_CREDITS_LOW'
    //     },
    //     { status: 503 }
    //   );
    // }

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
      // Use unified Wavespeed API like playground
      const apiEndpoint = getApiEndpointForProvider(selectedProvider);
      console.log(`Using ${selectedProvider} via Wavespeed API: ${apiEndpoint}`);

      // Get image dimensions to preserve aspect ratio
      let imageDimensions: { width: number; height: number } | undefined
      try {
        imageDimensions = await getImageDimensions(optimizedImageUrl)
        console.log('Original image dimensions:', imageDimensions)
      } catch (dimError) {
        console.warn('Could not fetch image dimensions, using defaults:', dimError)
      }

      // Build request body based on provider and enhancement type
      const requestBody = buildEnhancementRequestBody(
        selectedProvider,
        enhancementType,
        prompt,
        optimizedImageUrl,
        imageDimensions
      );
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      // Call unified Wavespeed API
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`${selectedProvider} API response status:`, response.status);

      if (response.ok) {
        responseData = await response.json();
        console.log(`${selectedProvider} API response:`, responseData);
        
        // Handle different response formats
        if (selectedProvider === 'seedream' && responseData.data?.id) {
          // Handle Seedream async response pattern
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
      } else {
        // If response is not ok, try to get error details
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.text();
          if (errorData) {
            errorMessage += ` - ${errorData}`;
          }
        } catch (e) {
          // Body already consumed or empty, use status message
        }
        throw new Error(errorMessage);
      }
    } catch (fetchError: any) {
      console.error(`Failed to call ${selectedProvider} API:`, fetchError);
      
      // ✅ REFUND CREDITS - API call failed
      await refundUserCredits(
        supabaseAdmin,
        user.id,
        USER_CREDITS_PER_ENHANCEMENT,
        enhancementType,
        `Network error: ${fetchError.message}`
      );

      // 🚨 SEND ALERT - API failure occurred
      const errorAnalysis = analyzeAPIError(fetchError.message || 'Unknown error');
      await sendAPIFailureAlert({
        type: errorAnalysis.type,
        provider: selectedProvider,
        errorMessage: `API call failed: ${fetchError.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        severity: errorAnalysis.severity
      });
      
      // Check if it's a network error
      if (fetchError.message?.includes('fetch')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to connect to enhancement service',
            details: 'Network error or service temporarily unavailable',
            code: 'NETWORK_ERROR',
            refunded: true
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enhancement service error',
          details: fetchError.message || 'Unknown error occurred',
          code: 'API_CALL_FAILED',
          refunded: true
        },
        { status: 500 }
      );
    }
    
    // Debug logging
    console.log(`${providerUsed} API response:`, JSON.stringify(responseData, null, 2));
    
    // Handle different response codes
    if (!response.ok || responseData.code !== 200) {
      console.error(`${providerUsed} API error:`, responseData);
      
      // ✅ REFUND CREDITS - API returned error
      await refundUserCredits(
        supabaseAdmin,
        user.id,
        USER_CREDITS_PER_ENHANCEMENT,
        enhancementType,
        `API error: ${responseData.msg || responseData.code}`
      );

      // 🚨 SEND ALERT - API returned error response
      const errorMessage = responseData.msg || responseData.message || `HTTP ${response.status}`;
      const errorAnalysis = analyzeAPIError(errorMessage);
      await sendAPIFailureAlert({
        type: errorAnalysis.type,
        provider: providerUsed,
        errorMessage: `API error response: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        severity: errorAnalysis.severity
      });
      
      // Handle specific error cases
      if (responseData.code === 402) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient credits in enhancement service',
            details: responseData.msg || 'Please contact support to add credits to your enhancement service account',
            code: 'ENHANCEMENT_SERVICE_CREDITS',
            refunded: true
          },
          { status: 402 }
        );
      }
      
      // Handle platform credits low error
      if (responseData.code === 503 && responseData.error?.includes('PLATFORM_CREDITS_LOW')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Enhancement service temporarily unavailable',
            details: 'The enhancement service is currently experiencing high demand. Please try again later or use the Seedream provider.',
            code: 'PLATFORM_CREDITS_LOW',
            refunded: true
          },
          { status: 503 }
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
            code: 'IMAGE_URL_INACCESSIBLE',
            refunded: true
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
            code: 'INVALID_IMAGE_FORMAT',
            refunded: true
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enhancement service error',
          details: responseData.msg || 'Failed to submit enhancement task',
          code: responseData.code || 'ENHANCEMENT_ERROR',
          refunded: true
        },
        { status: response.status }
      );
    }
    
    // Validate response structure for successful responses
    // Both providers return: { code: 200, data: { id, outputs[], status } }
    if (!responseData || !responseData.data || !responseData.data.id) {
      console.error(`Invalid ${providerUsed} response structure:`, responseData);

      // ✅ REFUND CREDITS - Invalid response
      await refundUserCredits(
        supabaseAdmin,
        user.id,
        USER_CREDITS_PER_ENHANCEMENT,
        enhancementType,
        'Invalid response structure from provider'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response from enhancement service',
          details: 'Missing task ID in response',
          response: responseData,
          refunded: true
        },
        { status: 500 }
      );
    }

    // Handle response - both providers use sync mode and return immediate results
    let enhancedImageUrl = null;
    let taskId = responseData.data.id; // Both providers return 'id'

    // Get the enhanced image URL from outputs array
    if (responseData.data.outputs && responseData.data.outputs.length > 0) {
      enhancedImageUrl = responseData.data.outputs[0];
    } else if (responseData.data.generated_url) {
      // Fallback for Seedream if it returns generated_url instead
      enhancedImageUrl = responseData.data.generated_url;
    }

    console.log(`${providerUsed} response:`, {
      taskId,
      status: responseData.data.status,
      enhancedUrl: enhancedImageUrl,
      executionTime: responseData.data.executionTime
    });
    
    // Store task in database using admin client
    // Generate a proper UUID for the database record
    const { randomUUID } = await import('crypto')
    const dbTaskId = randomUUID()

    const taskData: any = {
      id: dbTaskId,
      api_task_id: taskId, // Store provider's task ID separately
      user_id: user.id,
      moodboard_id: moodboardId,
      input_image_url: inputImageUrl,
      enhancement_type: enhancementType,
      prompt,
      strength,
      status: enhancedImageUrl ? 'completed' : 'processing',
      result_url: enhancedImageUrl, // Store the enhanced image URL
      provider: providerUsed,
      cost_usd: providerUsed === 'seedream' ? 0.05 : 0.025,
      created_at: new Date().toISOString()
    }

    const { error: taskError } = await supabaseAdmin
      .from('enhancement_tasks')
      .insert(taskData);

    if (taskError) {
      console.error('Failed to store task:', taskError);
      
      // ✅ REFUND CREDITS - Task creation failed
      await refundUserCredits(
        supabaseAdmin,
        user.id,
        USER_CREDITS_PER_ENHANCEMENT,
        enhancementType,
        `Task creation failed: ${taskError.message}`
      );
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to store enhancement task',
          details: taskError.message,
          refunded: true
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
        api_request_id: dbTaskId,
        enhancement_type: enhancementType,
        status: enhancedImageUrl ? 'completed' : 'processing',
        metadata: {
          provider_credits_used: providerCost.providerCredits,
          credit_ratio: providerCost.ratio,
          provider: providerUsed,
          api_task_id: taskId
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      taskId: dbTaskId,
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
    
    // Handle specific "Body has already been read" error
    if (error.message?.includes('Body has already been read') || error.message?.includes('Body is unusable')) {
      console.error('Request body consumption error - this usually indicates middleware or other code consuming the body');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request processing error',
          details: 'The request body was consumed multiple times. Please try again.',
          code: 'BODY_READ_ERROR'
        },
        { status: 400 }
      );
    }
    
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

// Helper functions for unified Wavespeed API usage
function getApiEndpointForProvider(provider: 'nanobanana' | 'seedream'): string {
  switch (provider) {
    case 'seedream':
      return 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit';
    case 'nanobanana':
      return 'https://api.wavespeed.ai/api/v3/google/nano-banana/edit';
    default:
      return 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit';
  }
}

function buildEnhancementRequestBody(
  provider: 'nanobanana' | 'seedream',
  enhancementType: string,
  prompt: string,
  imageUrl: string,
  imageDimensions?: { width: number; height: number }
) {
  // Calculate aspect ratio and size based on original dimensions
  let aspectRatio = '1:1'
  let size = '1024*1024'

  if (imageDimensions) {
    const { width, height } = imageDimensions
    const ratio = width / height

    // For NanoBanana: map to closest supported aspect ratio
    if (provider === 'nanobanana') {
      if (Math.abs(ratio - 1) < 0.1) aspectRatio = '1:1'
      else if (Math.abs(ratio - 1.5) < 0.1) aspectRatio = '3:2'
      else if (Math.abs(ratio - 0.67) < 0.1) aspectRatio = '2:3'
      else if (Math.abs(ratio - 0.75) < 0.1) aspectRatio = '3:4'
      else if (Math.abs(ratio - 1.33) < 0.1) aspectRatio = '4:3'
      else if (Math.abs(ratio - 0.8) < 0.1) aspectRatio = '4:5'
      else if (Math.abs(ratio - 1.25) < 0.1) aspectRatio = '5:4'
      else if (Math.abs(ratio - 0.56) < 0.1) aspectRatio = '9:16'
      else if (Math.abs(ratio - 1.78) < 0.1) aspectRatio = '16:9'
      else if (Math.abs(ratio - 2.33) < 0.1) aspectRatio = '21:9'
      else aspectRatio = ratio > 1 ? '16:9' : '9:16' // Default to common ratios
    }

    // For Seedream: preserve exact dimensions (max 4096px)
    if (provider === 'seedream') {
      const maxDim = 4096
      let targetWidth = width
      let targetHeight = height

      // Scale down if either dimension exceeds 4096
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          targetWidth = maxDim
          targetHeight = Math.round((maxDim / width) * height)
        } else {
          targetHeight = maxDim
          targetWidth = Math.round((maxDim / height) * width)
        }
      }

      // Ensure dimensions are at least 1024 (minimum supported)
      targetWidth = Math.max(1024, targetWidth)
      targetHeight = Math.max(1024, targetHeight)

      size = `${targetWidth}*${targetHeight}`
    }
  }

  const baseBody: any = {
    images: [imageUrl],
    enable_base64_output: false,
    enable_sync_mode: true
  }

  // Add provider-specific parameters
  if (provider === 'nanobanana') {
    baseBody.aspect_ratio = aspectRatio
  } else if (provider === 'seedream') {
    baseBody.size = size
  }

  // Build optimized prompts based on enhancement type and provider
  let optimizedPrompt = prompt;
  
  switch (enhancementType) {
    case 'lighting':
      optimizedPrompt = `Improve lighting and exposure: ${prompt}. Focus on natural lighting, proper exposure, and dramatic shadows if requested.`;
      break;
    case 'style':
      optimizedPrompt = `Apply artistic style transformation: ${prompt}. Transform the visual style while preserving the main subject and composition.`;
      break;
    case 'background':
      optimizedPrompt = `Replace or enhance background: ${prompt}. Change the background while maintaining the main subject perfectly.`;
      break;
    case 'mood':
      optimizedPrompt = `Change overall atmosphere and mood: ${prompt}. Modify the emotional tone and visual atmosphere of the image.`;
      break;
    case 'custom':
      optimizedPrompt = prompt;
      break;
    default:
      optimizedPrompt = `${enhancementType}: ${prompt}`;
  }

  // Provider-specific request body adjustments
  if (provider === 'nanobanana') {
    return {
      ...baseBody,
      prompt: optimizedPrompt,
      type: 'IMAGETOIAMGE',
      numImages: 1,
      watermark: 'Preset'
    };
  } else {
    // Seedream format
    return {
      ...baseBody,
      prompt: optimizedPrompt
    };
  }
}