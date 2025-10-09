import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '../../../../lib/auth-utils'

// Manually load environment variables if not available
if (!process.env.WAVESPEED_API_KEY) {
  try {
    require('dotenv').config({ path: '.env.local' })
  } catch (e) {
    console.log('Could not load .env.local:', e)
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const wavespeedApiKey = process.env.WAVESPEED_API_KEY!

// Debug environment variables
console.log('🔧 Environment check:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasWavespeedKey: !!wavespeedApiKey,
  wavespeedKeyPrefix: wavespeedApiKey?.substring(0, 10) + '...',
  nodeEnv: process.env.NODE_ENV,
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('WAVE'))
})

export async function POST(request: NextRequest) {
  console.log('🎬 Video generation API called')
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    console.log('🔑 Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('❌ No authorization header provided')
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Parse request body
    const requestBody = await request.json()
    console.log('📝 Request body:', requestBody)
    
    const {
      imageUrl,
      duration,
      resolution,
      cameraMovement,
      aspectRatio,
      prompt,
      videoStyle,
      yPosition,
      projectId,
      cinematicParameters,
      includeTechnicalDetails,
      includeStyleReferences,
      selectedProvider = 'seedream',
      presetId
    } = requestBody

    // Validate required fields based on provider
    if (selectedProvider === 'wan') {
      // Wan supports text-to-video (no image required) or image-to-video
      if (!duration || !resolution || !aspectRatio) {
        console.log('❌ Missing required fields for Wan:', { duration: !!duration, resolution: !!resolution, aspectRatio: !!aspectRatio })
        return NextResponse.json(
          { success: false, error: 'Missing required fields for Wan: duration, resolution, aspectRatio' },
          { status: 400 }
        )
      }
      if (!imageUrl && !prompt) {
        return NextResponse.json(
          { success: false, error: 'Either imageUrl or prompt is required for Wan video generation' },
          { status: 400 }
        )
      }
    } else {
      // Seedream only supports image-to-video
      if (!imageUrl || !duration || !resolution || !cameraMovement || !aspectRatio) {
        console.log('❌ Missing required fields for Seedream:', { imageUrl: !!imageUrl, duration: !!duration, resolution: !!resolution, cameraMovement: !!cameraMovement, aspectRatio: !!aspectRatio })
        return NextResponse.json(
          { success: false, error: 'Missing required fields for Seedream: imageUrl, duration, resolution, cameraMovement, aspectRatio' },
          { status: 400 }
        )
      }
    }

    // Calculate credits based on provider, duration and resolution
    const baseCredits = selectedProvider === 'wan' ? 12 : 8
    const durationMultiplier = duration > 5 ? 1.5 : 1
    const resolutionMultiplier = resolution === '720p' ? 1.5 : 1
    const creditsRequired = Math.ceil(baseCredits * durationMultiplier * resolutionMultiplier)

    // Check user credits
    console.log('💰 Checking user credits for user:', user.id)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single()

    console.log('💰 Credits check result:', { userCredits, creditsError })

    if (creditsError || !userCredits) {
      console.log('❌ Credits check failed:', creditsError)
      return NextResponse.json(
        { success: false, error: 'Failed to check user credits' },
        { status: 500 }
      )
    }

    if (userCredits.current_balance < creditsRequired) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. Required: ${creditsRequired}, Available: ${userCredits.current_balance}` },
        { status: 400 }
      )
    }

    // Enhance prompt with cinematic parameters if provided
    let enhancedPrompt = prompt
    if (cinematicParameters && Object.keys(cinematicParameters).length > 0) {
      enhancedPrompt = await enhancePromptWithCinematicParameters(prompt, cinematicParameters, includeTechnicalDetails, includeStyleReferences)
      console.log('🎬 Enhanced prompt with cinematic parameters:', enhancedPrompt)
    }

    let videoResult: { videoUrl: string; taskId: string; styledImageUrl?: string | null }
    let processedImageUrl: string | null = null // Fixed scope issue

    // Choose provider and generation method
    if (selectedProvider === 'wan') {
      console.log('🚀 Using Wan 2.5 for video generation...')

      if (imageUrl) {
        // Wan image-to-video
        console.log('🖼️ Wan image-to-video generation')
        processedImageUrl = await processImageForAspectRatio(imageUrl, aspectRatio, resolution, yPosition)
        videoResult = await generateVideoWithWan(processedImageUrl, duration, resolution, aspectRatio, enhancedPrompt, true)
      } else {
        // Wan text-to-video
        console.log('📝 Wan text-to-video generation')
        videoResult = await generateVideoWithWan(null, duration, resolution, aspectRatio, enhancedPrompt, false)
      }
    } else {
      // Seedream (existing implementation)
      console.log('🚀 Using Seedream for image-to-video generation...')

      // If videoStyle is explicitly provided, apply it to the image first
      let finalImageUrl = imageUrl
      const shouldApplyStyle = videoStyle && videoStyle.trim() !== '' && videoStyle.toLowerCase() !== 'none'

      if (shouldApplyStyle) {
        // Video style explicitly selected - apply the style to the image first
        console.log('🎨 Video style selected - applying style to image before video generation...')
        console.log('🎨 Video style:', videoStyle)
        console.log('🎨 Enhanced prompt:', enhancedPrompt)
        try {
          finalImageUrl = await applyStyleToImage(imageUrl, enhancedPrompt, aspectRatio, resolution)
          console.log('✅ Style applied to image successfully:', finalImageUrl)
        } catch (error) {
          console.error('❌ Failed to apply style to image:', error)
          // Continue with original image if style application fails
          console.log('⚠️ Continuing with original image...')
        }
      } else {
        console.log('💨 No video style selected - using original image for video generation')
      }

      processedImageUrl = await processImageForAspectRatio(finalImageUrl, aspectRatio, resolution, yPosition)

      console.log('🖼️ Image processing completed:', {
        originalImageUrl: imageUrl,
        styledImageUrl: finalImageUrl,
        processedImageUrl: processedImageUrl,
        aspectRatio: aspectRatio,
        resolution: resolution,
        yPosition: yPosition,
        customDimensions: getTargetDimensions(aspectRatio, resolution)
      })

      videoResult = await generateVideoWithWaveSpeed(processedImageUrl, duration, resolution, cameraMovement, enhancedPrompt)

      // Store the styled image URL if style was applied (for Seedream only)
      const styledImageUrl = finalImageUrl !== imageUrl ? finalImageUrl : null
      videoResult.styledImageUrl = styledImageUrl
    }

    console.log('✅ Video generation API response:', videoResult)

    // Store generation parameters in database for later retrieval
    try {
      const insertData = {
        id: videoResult.taskId,
        user_id: user.id,
        video_url: 'pending', // Placeholder - will be updated when task completes
        duration: duration,
        resolution: resolution,
        generation_metadata: {
          aspect_ratio: aspectRatio,
          camera_movement: cameraMovement,
          prompt: prompt,
          enhanced_prompt: enhancedPrompt,
          image_url: imageUrl,
          styled_image_url: videoResult.styledImageUrl || null,
          processed_image_url: processedImageUrl,
          y_position: yPosition || 0,
          custom_dimensions: getTargetDimensions(aspectRatio, resolution),
          resolution: resolution,
          duration: duration,
          created_at: new Date().toISOString(),
          task_id: videoResult.taskId,
          cinematic_parameters: cinematicParameters || null,
          include_technical_details: includeTechnicalDetails ?? true,
          include_style_references: includeStyleReferences ?? true
        }
      }
      
      console.log('📝 Storing video generation parameters:', insertData)
      
      const { data: insertResult, error: insertError } = await supabaseAdmin
        .from('playground_video_generations')
        .insert(insertData)
        .select()
      
      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        throw insertError
      }
      
      console.log('✅ Video generation parameters stored in database:', insertResult)
    } catch (error) {
      console.error('❌ Failed to store video generation parameters:', error)
      // Don't fail the request if database storage fails
    }

    // Deduct credits
    await supabaseAdmin
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsRequired,
        consumed_this_month: userCredits.current_balance - creditsRequired,
        last_consumed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    // Log the transaction
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'video_generation',
        credits_used: creditsRequired,
        balance_before: userCredits.current_balance,
        balance_after: userCredits.current_balance - creditsRequired,
        description: `Video generation: ${duration}s ${resolution} ${cameraMovement} camera movement`,
        reference_id: projectId || null,
        cost_usd: creditsRequired * 0.01, // Assuming $0.01 per credit
        status: 'completed'
      })

    // Track preset usage if a preset was used
    if (presetId && presetId !== 'local-preset') {
      try {
        const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/presets/${presetId}/usage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('authorization') || ''
          }
        })

        if (usageResponse.ok) {
          console.log('📊 Tracked video preset usage for:', presetId)
        } else {
          console.warn('⚠️ Failed to track video preset usage:', await usageResponse.text())
        }
      } catch (error) {
        console.warn('⚠️ Error tracking video preset usage:', error)
      }
    }

    return NextResponse.json({
      success: true,
      videoUrl: videoResult.videoUrl,
      taskId: videoResult.taskId,
      creditsUsed: creditsRequired,
      processedImageUrl,
      styledImageUrl: videoResult.styledImageUrl || null,
      aspectRatio,
      resolution,
      duration,
      cameraMovement,
      presetId: presetId || null
    })

  } catch (error) {
    console.error('❌ Video generation error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Video generation failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

async function processImageForAspectRatio(imageUrl: string, aspectRatio: string, resolution: string, yPosition?: number): Promise<string> {
  try {
    console.log(`🖼️ Processing image for aspect ratio ${aspectRatio} and resolution ${resolution}`)
    if (yPosition !== undefined) {
      console.log(`📍 Y position adjustment: ${yPosition}px`)
    }
    
    // Calculate target dimensions based on aspect ratio and resolution
    const targetDimensions = getTargetDimensions(aspectRatio, resolution)
    console.log(`📐 Target dimensions: ${targetDimensions.width}x${targetDimensions.height}`)
    
    // Call the image processing service
    const processingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/playground/image-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        aspectRatio,
        resolution,
        yPosition: yPosition || 0
      })
    })
    
    if (!processingResponse.ok) {
      const errorData = await processingResponse.json()
      console.error('❌ Image processing service error:', errorData)
      throw new Error(`Image processing failed: ${errorData.error}`)
    }
    
    const processingResult = await processingResponse.json()
    
    if (!processingResult.success) {
      throw new Error(`Image processing failed: ${processingResult.error}`)
    }
    
    console.log('✅ Image processed successfully:', {
      originalUrl: imageUrl,
      processedUrl: processingResult.processedImageUrl,
      originalDimensions: processingResult.originalDimensions,
      targetDimensions: processingResult.targetDimensions,
      cropInfo: processingResult.cropInfo
    })
    
    return processingResult.processedImageUrl
    
  } catch (error) {
    console.error('❌ Error processing image for aspect ratio:', error)
    console.log('⚠️ Falling back to original image URL')
    return imageUrl // Fallback to original
  }
}

function getTargetDimensions(aspectRatio: string, resolution: string): { width: number; height: number } {
  // Define target dimensions based on aspect ratio and resolution
  const resolutionMap = {
    '480p': { baseWidth: 854, baseHeight: 480 },
    '720p': { baseWidth: 1280, baseHeight: 720 }
  }
  
  const baseDimensions = resolutionMap[resolution as keyof typeof resolutionMap] || resolutionMap['480p']
  
  switch (aspectRatio) {
    case '1:1':
      const size = Math.min(baseDimensions.baseWidth, baseDimensions.baseHeight)
      return { width: size, height: size }
    case '16:9':
      return { width: baseDimensions.baseWidth, height: baseDimensions.baseHeight }
    case '9:16':
      return { width: baseDimensions.baseHeight, height: baseDimensions.baseWidth }
    case '21:9':
      // Ultra-wide aspect ratio
      const width219 = baseDimensions.baseWidth
      const height219 = Math.round(width219 * 9 / 21)
      return { width: width219, height: height219 }
    case '4:3':
      const width43 = baseDimensions.baseWidth
      const height43 = Math.round(width43 * 3 / 4)
      return { width: width43, height: height43 }
    case '3:4':
      const height34 = baseDimensions.baseHeight
      const width34 = Math.round(height34 * 3 / 4)
      return { width: width34, height: height34 }
    default:
      return { width: baseDimensions.baseWidth, height: baseDimensions.baseHeight }
  }
}


async function generateVideoWithWaveSpeed(imageUrl: string, duration: number, resolution: string, cameraMovement: string, prompt?: string): Promise<{ videoUrl: string; taskId: string }> {
  try {
    // Choose the appropriate WaveSpeed model based on resolution
    const modelEndpoint = resolution === '720p' 
      ? 'https://api.wavespeed.ai/api/v3/bytedance/seedance-v1-pro-i2v-720p'
      : 'https://api.wavespeed.ai/api/v3/bytedance/seedance-v1-pro-i2v-480p'

    // Create motion prompt based on camera movement and user input
    // If both style prompt and camera movement exist, combine them
    let motionPrompt = ''
    if (prompt && prompt.trim()) {
      // Has style prompt - add camera movement description to it
      const movementDesc = await getCameraMovementDescription(cameraMovement)
      motionPrompt = `${prompt.trim()}. ${movementDesc}`
    } else {
      // No style prompt - use camera movement only
      const movementPrompt = await getCameraMovementPrompt(cameraMovement)
      motionPrompt = movementPrompt
    }

    console.log('🎬 Final motion prompt being sent to WaveSpeed:', motionPrompt)
    console.log('🎬 Original prompt parameter:', prompt)
    console.log('🎬 Camera movement:', cameraMovement)

    const requestBody = {
      image: imageUrl,
      prompt: motionPrompt,
      duration: duration,
      camera_fixed: false,
      seed: -1
    }

    console.log('🌊 WaveSpeed request:', {
      endpoint: modelEndpoint,
      body: requestBody,
      hasApiKey: !!wavespeedApiKey,
      processedImageUrl: imageUrl,
      note: 'Using processed image with custom dimensions and framing'
    })

    // Call WaveSpeed API
    const response = await fetch(modelEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wavespeedApiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 WaveSpeed response status:', response.status)
    
      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ WaveSpeed API error:', errorData)
        
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error('WaveSpeed API key is invalid or expired. Please contact support.')
        } else if (response.status === 400) {
          throw new Error(`Invalid request: ${errorData.message || 'Check your input parameters'}`)
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        } else {
          throw new Error(`WaveSpeed API error: ${errorData.message || 'Unknown error'}`)
        }
      }

    const result = await response.json()
    console.log('📋 WaveSpeed API result:', result)
    
    if (result.code !== 200) {
      console.log('❌ WaveSpeed API failed:', result.message)
      throw new Error(`WaveSpeed API error: ${result.message}`)
    }


    // Return the task ID and a placeholder URL (will be updated when task completes)
    console.log('✅ Video generation task created:', { taskId: result.data.id })
    return {
      videoUrl: '', // Will be populated when task completes
      taskId: result.data.id
    }

  } catch (error) {
    console.error('WaveSpeed video generation error:', error)
    throw error
  }
}

// Fetch camera movement description from database
async function getCameraMovementPrompt(cameraMovement: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('camera_movements')
      .select('label, description')
      .eq('value', cameraMovement)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('Error fetching camera movement:', error)
      return 'Smooth, controlled camera movement'
    }

    return `${data.label}: ${data.description}`
  } catch (error) {
    console.error('Error in getCameraMovementPrompt:', error)
    return 'Smooth, controlled camera movement'
  }
}

// Get camera movement description to append to prompts
async function getCameraMovementDescription(cameraMovement: string): Promise<string> {
  const prompt = await getCameraMovementPrompt(cameraMovement)
  return `Add ${prompt.toLowerCase()}`
}

async function enhancePromptWithCinematicParameters(
  basePrompt: string, 
  cinematicParameters: any, 
  includeTechnicalDetails: boolean = true, 
  includeStyleReferences: boolean = true
): Promise<string> {
  try {
    // Import the CinematicPromptBuilder
    const { CinematicPromptBuilder } = await import('../../../../../../packages/services/src/cinematic-prompt-builder')
    
    const promptBuilder = new CinematicPromptBuilder()
    
    // Construct enhanced prompt using the same logic as image generation
    const constructedPrompt = promptBuilder.constructPrompt({
      basePrompt,
      cinematicParameters,
      enhancementType: 'cinematic',
      includeTechnicalDetails,
      includeStyleReferences
    })
    
    const enhancedPrompt = constructedPrompt.fullPrompt
    
    return enhancedPrompt
  } catch (error) {
    console.error('Error enhancing prompt with cinematic parameters:', error)
    return basePrompt // Fallback to original prompt
  }
}

// Wan 2.5 video generation function
async function generateVideoWithWan(
  imageUrl: string | null,
  duration: number,
  resolution: string,
  aspectRatio: string,
  prompt: string,
  isImageToVideo: boolean
): Promise<{ videoUrl: string; taskId: string }> {
  try {
    let endpoint: string
    let requestBody: any

    if (isImageToVideo) {
      // Wan image-to-video endpoint - uses resolution format (480p/720p/1080p)
      endpoint = 'https://api.wavespeed.ai/api/v3/alibaba/wan-2.5/image-to-video'
      requestBody = {
        image: imageUrl,
        prompt: prompt || 'Add natural motion to the scene',
        resolution: resolution || '720p', // 480p, 720p, or 1080p
        duration,
        enable_prompt_expansion: true, // Enable for better style interpretation
        seed: -1
      }
    } else {
      // Wan text-to-video endpoint - uses size format (width*height)
      // Map aspect ratio to Wan size format
      const sizeMap: { [key: string]: string } = {
        '16:9': resolution === '720p' ? '1280*720' : resolution === '1080p' ? '1920*1080' : '832*480',
        '9:16': resolution === '720p' ? '720*1280' : resolution === '1080p' ? '1080*1920' : '480*832',
        '1:1': '1280*720', // Default to 16:9 for 1:1
        '4:3': '1280*720',
        '3:4': '720*1280'
      }

      const size = sizeMap[aspectRatio] || '1280*720'

      endpoint = 'https://api.wavespeed.ai/api/v3/alibaba/wan-2.5/text-to-video'
      requestBody = {
        prompt: prompt || 'Create a video',
        size,
        duration,
        enable_prompt_expansion: true, // Enable for better style interpretation
        seed: -1
      }
    }

    console.log('🌊 Wan API request:', {
      endpoint,
      body: requestBody,
      hasApiKey: !!wavespeedApiKey,
      mode: isImageToVideo ? 'image-to-video' : 'text-to-video'
    })

    // Call Wan API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wavespeedApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.log('❌ Wan API error response:', errorData)
      throw new Error(`Wan API error: ${errorData.message || 'Unknown error'}`)
    }

    const result = await response.json()
    console.log('📋 Wan API result:', result)

    if (result.code !== 200) {
      console.log('❌ Wan API failed:', result.message)
      throw new Error(`Wan API error: ${result.message}`)
    }

    // Return the task ID
    console.log('✅ Wan video generation task created:', { taskId: result.data.id })
    return {
      videoUrl: '', // Will be populated when task completes
      taskId: result.data.id
    }

  } catch (error) {
    console.error('Wan video generation error:', error)
    throw error
  }
}

// Apply style to image using image-to-image transformation
async function applyStyleToImage(
  imageUrl: string,
  stylePrompt: string,
  aspectRatio: string,
  resolution: string
): Promise<string> {
  console.log('🎨 Applying style to image:', {
    imageUrl: imageUrl.substring(0, 50) + '...',
    stylePrompt: stylePrompt.substring(0, 100) + '...',
    aspectRatio,
    resolution
  })

  try {
    // Map video resolution to image generation size
    const sizeMap: { [key: string]: string } = {
      '480p-16:9': '832x480',
      '480p-9:16': '480x832',
      '480p-1:1': '480x480',
      '720p-16:9': '1280x720',
      '720p-9:16': '720x1280',
      '720p-1:1': '720x720',
      '1080p-16:9': '1920x1080',
      '1080p-9:16': '1080x1920',
      '1080p-1:1': '1080x1080'
    }

    const size = sizeMap[`${resolution}-${aspectRatio}`] || '832x480'

    // Use NanoBanana image-to-image for style transformation
    const response = await fetch('https://api.wavespeed.ai/api/v3/google/nano-banana/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wavespeedApiKey}`
      },
      body: JSON.stringify({
        prompt: stylePrompt,
        images: [imageUrl],
        size: size,
        enable_base64_output: false,
        enable_sync_mode: false // Use async for better reliability
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Style application API error:', errorText)
      throw new Error(`Failed to apply style: ${response.status}`)
    }

    const result = await response.json()
    console.log('📡 Style application response:', result)

    // If sync mode, return URL directly
    if (result.outputs && result.outputs.length > 0) {
      const styledImageUrl = typeof result.outputs[0] === 'string'
        ? result.outputs[0]
        : result.outputs[0].url || result.outputs[0].image_url

      if (styledImageUrl) {
        return styledImageUrl
      }
    }

    // Otherwise, poll for result
    if (result.id) {
      const taskId = result.id
      console.log('🔄 Polling for styled image result, taskId:', taskId)

      const maxAttempts = 30
      const pollInterval = 2000 // 2 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))

        const statusResponse = await fetch(`https://api.wavespeed.ai/api/v3/google/nano-banana/fetch/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${wavespeedApiKey}`
          }
        })

        if (!statusResponse.ok) {
          console.error('❌ Failed to check style task status:', await statusResponse.text())
          continue
        }

        const statusData = await statusResponse.json()
        console.log(`🔄 Style task status (attempt ${attempt + 1}):`, statusData.status)

        if (statusData.status === 'completed' && statusData.outputs && statusData.outputs.length > 0) {
          const styledImageUrl = typeof statusData.outputs[0] === 'string'
            ? statusData.outputs[0]
            : statusData.outputs[0].url || statusData.outputs[0].image_url

          console.log('✅ Style applied successfully:', styledImageUrl)
          return styledImageUrl
        } else if (statusData.status === 'failed') {
          throw new Error(`Style application failed: ${statusData.error || 'Unknown error'}`)
        }
      }

      throw new Error('Style application timeout')
    }

    throw new Error('No task ID or output URL received from style application')
  } catch (error) {
    console.error('❌ Style application error:', error)
    throw error
  }
}