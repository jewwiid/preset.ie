import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CinematicParameters } from '@preset/types';
import CinematicPromptBuilder from '../../../../../packages/services/src/cinematic-prompt-builder';

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
  console.log('Enhanced Cinematic Enhancement API called');
  
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

    // Parse request body with cinematic parameters
    const { 
      inputImageUrl, 
      enhancementType, 
      prompt, 
      strength = 0.8,
      moodboardId,
      cinematicParameters = {},
      includeTechnicalDetails = true,
      includeStyleReferences = true
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
        .eq('id', user.id)
        .single();

      const subscriptionTier = profile?.subscription_tier || 'free';
      
      // Create credits record
      const { error: createError } = await supabaseAdmin
        .from('user_credits')
        .insert({
          user_id: user.id,
          current_balance: subscriptionTier === 'free' ? 0 : 10,
          subscription_tier: subscriptionTier,
          consumed_this_month: 0
        });

      if (createError) {
        console.error('Error creating user credits:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to initialize user credits' },
          { status: 500 }
        );
      }

      // Re-fetch the credits
      const { data: newCredits } = await supabaseAdmin
        .from('user_credits')
        .select('current_balance, subscription_tier, consumed_this_month')
        .eq('user_id', user.id)
        .single();
      
      userCredits = newCredits;
    }

    if (!userCredits) {
      return NextResponse.json(
        { success: false, error: 'Unable to verify user credits' },
        { status: 500 }
      );
    }

    // Check if user has enough credits
    if (userCredits.current_balance < USER_CREDITS_PER_ENHANCEMENT) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient credits',
          currentBalance: userCredits.current_balance,
          requiredCredits: USER_CREDITS_PER_ENHANCEMENT
        },
        { status: 402 }
      );
    }

    // Use CinematicPromptBuilder to construct enhanced prompt
    const promptBuilder = new CinematicPromptBuilder();
    const constructedPrompt = promptBuilder.constructPrompt({
      basePrompt: prompt,
      cinematicParameters: cinematicParameters as Partial<CinematicParameters>,
      enhancementType,
      includeTechnicalDetails,
      includeStyleReferences
    });

    console.log('Constructed prompt:', constructedPrompt.fullPrompt);
    console.log('Cinematic tags:', constructedPrompt.cinematicTags);

    // Call NanoBanana API with enhanced prompt
    const enhancementResponse = await fetch('https://api.nanobananapi.ai/enhance', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nanoBananaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_image: inputImageUrl,
        prompt: constructedPrompt.fullPrompt,
        strength: strength,
        aspect_ratio: cinematicParameters.aspectRatio || '16:9',
        model: 'enhance-v1'
      })
    });

    if (!enhancementResponse.ok) {
      const errorData = await enhancementResponse.text();
      console.error('NanoBanana API error:', errorData);
      return NextResponse.json(
        { success: false, error: `Enhancement failed: ${errorData}` },
        { status: 500 }
      );
    }

    const enhancementData = await enhancementResponse.json();
    console.log('NanoBanana response:', enhancementData);

    // Deduct credits
    const newBalance = userCredits.current_balance - USER_CREDITS_PER_ENHANCEMENT;
    const newConsumed = userCredits.consumed_this_month + USER_CREDITS_PER_ENHANCEMENT;

    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({
        current_balance: newBalance,
        consumed_this_month: newConsumed
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      // Don't fail the request, just log the error
    }

    // Prepare cinematic metadata for storage
    const cinematicMetadata: CinematicParameters = {
      ...cinematicParameters,
      enhancementType,
      enhancementPrompt: constructedPrompt.fullPrompt,
      aiProvider: PROVIDER,
      generationCost: 0.025, // NanoBanana cost
      generatedAt: new Date().toISOString()
    };

    // Store enhanced image in Supabase with cinematic metadata
    const enhancedImageUrl = enhancementData.output_image || enhancementData.enhanced_url;
    
    if (enhancedImageUrl) {
      // Upload to Supabase storage
      const fileName = `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const bucketName = 'enhanced-images';
      
      // Download the enhanced image
      const imageResponse = await fetch(enhancedImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
      } else {
        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        // Store metadata in media table
        const { error: mediaError } = await supabaseAdmin
          .from('media')
          .insert({
            owner_user_id: user.id,
            gig_id: null,
            type: 'image',
            bucket: bucketName,
            path: fileName,
            filename: fileName,
            width: enhancementData.width || null,
            height: enhancementData.height || null,
            palette: enhancementData.palette || null,
            blurhash: enhancementData.blurhash || null,
            exif_json: enhancementData.exif || null,
            visibility: 'private',
            ai_metadata: cinematicMetadata
          });

        if (mediaError) {
          console.error('Media storage error:', mediaError);
        }
      }
    }

    // Return success response with cinematic metadata
    return NextResponse.json({
      success: true,
      enhancedUrl: enhancedImageUrl,
      cost: USER_CREDITS_PER_ENHANCEMENT,
      newBalance: newBalance,
      cinematicMetadata: cinematicMetadata,
      constructedPrompt: {
        fullPrompt: constructedPrompt.fullPrompt,
        technicalDetails: constructedPrompt.technicalDetails,
        styleReferences: constructedPrompt.styleReferences,
        cinematicTags: constructedPrompt.cinematicTags,
        estimatedTokens: constructedPrompt.estimatedTokens
      }
    });

  } catch (error) {
    console.error('Enhancement API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}