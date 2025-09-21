import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper function to generate with WaveSpeed NanoBanana
async function generateWithWaveSpeedNanoBanana({
  prompt,
  baseImage,
  size,
  enableBase64Output,
  enableSyncMode,
  consistencyLevel,
  imageIndex,
  totalImages,
  generationMode
}: {
  prompt: string
  baseImage?: string
  size: string
  enableBase64Output: boolean
  enableSyncMode: boolean
  consistencyLevel: string
  imageIndex: number
  totalImages: number
  generationMode: 'text-to-image' | 'image-to-image'
}) {
  try {
    const isImageToImage = generationMode === 'image-to-image' && baseImage
    
    // Choose the correct endpoint based on generation mode
    const apiEndpoint = isImageToImage 
      ? 'https://api.wavespeed.ai/api/v3/google/nano-banana/edit'
      : 'https://api.wavespeed.ai/api/v3/google/nano-banana/text-to-image'
    
    console.log('🔗 WaveSpeed NanoBanana API request:', {
      endpoint: apiEndpoint,
      prompt: prompt.substring(0, 100) + '...',
      hasBaseImage: !!baseImage,
      enableSyncMode,
      enableBase64Output
    })

    // Build request body according to WaveSpeed API spec
    const requestBody: any = {
      prompt: prompt,
      output_format: 'png',
      enable_sync_mode: enableSyncMode,
      enable_base64_output: enableBase64Output
    }

    // Add images array for image-to-image editing
    if (isImageToImage && baseImage) {
      requestBody.images = [baseImage]
      console.log('🖼️ WaveSpeed NanoBanana image-to-image request:', {
        endpoint: apiEndpoint,
        prompt: prompt.substring(0, 50) + '...',
        imagesCount: 1,
        baseImageUrl: baseImage.substring(0, 50) + '...',
        outputFormat: requestBody.output_format,
        syncMode: enableSyncMode,
        requestBodyKeys: Object.keys(requestBody),
        fullRequestBody: JSON.stringify(requestBody, null, 2)
      })
      
      // Validate against official schema
      console.log('📋 Schema validation:', {
        hasRequiredPrompt: !!requestBody.prompt,
        hasRequiredImages: !!requestBody.images && Array.isArray(requestBody.images) && requestBody.images.length > 0,
        imagesArrayLength: requestBody.images?.length || 0,
        outputFormatValid: ['png', 'jpeg'].includes(requestBody.output_format),
        syncModeType: typeof requestBody.enable_sync_mode,
        base64OutputType: typeof requestBody.enable_base64_output
      })
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ WaveSpeed NanoBanana API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        endpoint: apiEndpoint,
        isImageToImage,
        hasBaseImage: !!baseImage
      })
      throw new Error(`WaveSpeed API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('🎨 WaveSpeed NanoBanana API response:', {
      code: data.code,
      message: data.message,
      hasData: !!data.data,
      hasId: !!data.data?.id,
      id: data.data?.id,
      status: data.data?.status,
      model: data.data?.model,
      hasOutputs: !!data.data?.outputs?.length,
      outputsCount: data.data?.outputs?.length || 0,
      hasUrls: !!data.data?.urls,
      createdAt: data.data?.created_at
    })
    
    // Handle completed response - image is ready immediately
    if (data.data?.status === 'completed' && data.data?.outputs?.length > 0) {
      return {
        success: true,
        taskId: data.data.id,
        imageUrl: data.data.outputs[0],
        provider: 'wavespeed-nanobanan',
        cost: 0.025,
        message: `WaveSpeed NanoBanana ${isImageToImage ? 'image edit' : 'image generation'} completed successfully!`
      }
    }
    
    // Handle async mode - need to poll for results
    if (data.data?.id) {
      // Poll for results
      const maxAttempts = 30 // 30 seconds max
      let attempts = 0
      
      while (attempts < maxAttempts) {
        attempts++
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        
        const resultResponse = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${data.data.id}/result`, {
          headers: {
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
          }
        })
        
        if (resultResponse.ok) {
          const resultData = await resultResponse.json()
          console.log(`🔄 Polling attempt ${attempts}:`, resultData.status)
          
          if (resultData.status === 'completed' && resultData.outputs?.length > 0) {
            return {
              success: true,
              taskId: data.data.id,
              imageUrl: resultData.outputs[0],
              provider: 'wavespeed-nanobanan',
              cost: 0.025,
              message: `WaveSpeed NanoBanana ${isImageToImage ? 'image edit' : 'image generation'} completed successfully (async mode)`
            }
          } else if (resultData.status === 'failed') {
            throw new Error(`Task failed: ${resultData.error || 'Unknown error'}`)
          }
          // Continue polling if still processing
        }
      }
      
      throw new Error('Task timed out after 30 seconds')
    }
    
    throw new Error(`No task ID returned from WaveSpeed API. Response: ${JSON.stringify(data)}`)
  } catch (error) {
    console.error('WaveSpeed NanoBanana generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'wavespeed-nanobanan'
    }
  }
}

// Helper function to generate with NanoBanana (Legacy - deprecated)
async function generateWithNanoBanana({
  prompt,
  baseImage,
  size,
  enableBase64Output,
  enableSyncMode,
  consistencyLevel,
  imageIndex,
  totalImages,
  generationMode
}: {
  prompt: string
  baseImage?: string
  size: string
  enableBase64Output: boolean
  enableSyncMode: boolean
  consistencyLevel: string
  imageIndex: number
  totalImages: number
  generationMode: 'text-to-image' | 'image-to-image'
}) {
  try {
    const isImageToImage = generationMode === 'image-to-image' && baseImage
    
    // Use official NanoBanana API endpoint
    const apiEndpoint = 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate'
    
    // Create callback URL for this request
    // Use Vercel deployment URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://web-brown-three-40.vercel.app'
    const callbackUrl = `${baseUrl}/api/nanobanana/callback`
    
    console.log('🔗 Callback URL:', callbackUrl)
    
    // Build request body according to official API spec
    const requestBody = {
      prompt: prompt,
      type: isImageToImage ? 'IMAGETOIAMGE' : 'TEXTTOIAMGE',
      callBackUrl: callbackUrl,
      numImages: 1, // Generate one image at a time
      watermark: 'Preset', // Add our watermark
      ...(isImageToImage && baseImage && {
        imageUrls: [baseImage]
      })
    }

    console.log('NanoBanana API request:', {
      endpoint: apiEndpoint,
      type: requestBody.type,
      prompt: prompt.substring(0, 100) + '...',
      hasBaseImage: !!baseImage,
      callbackUrl: callbackUrl
    })

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NANOBANANA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NanoBanana API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('NanoBanana API response:', data)
    
    // Check if the response is successful
    if (data.code !== 200) {
      throw new Error(`NanoBanana API error: ${data.msg || 'Unknown error'}`)
    }
    
    // Return task info - the actual image will come via callback
    return {
      success: true,
      taskId: data.data.taskId,
      provider: 'nanobanana',
      cost: 0.025,
      message: 'Task submitted successfully, waiting for callback...'
    }
  } catch (error) {
    console.error('NanoBanana generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'nanobanana'
    }
  }
}

// Helper function to generate a single image-to-image
async function generateSingleImageToImage({
  prompt,
  baseImage,
  size,
  enableBase64Output,
  enableSyncMode,
  consistencyLevel,
  imageIndex,
  totalImages
}: {
  prompt: string
  baseImage: string
  size: string
  enableBase64Output: boolean
  enableSyncMode: boolean
  consistencyLevel: string
  imageIndex: number
  totalImages: number
}) {
  
  try {
    const response = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        images: [baseImage],
        size,
        enable_base64_output: enableBase64Output,
        enable_sync_mode: false // Use async mode for better reliability
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }
    
    const responseData = await response.json()
    
    // Handle async response using official API pattern
    if (responseData.data?.id) {
      const requestId = responseData.data.id
      console.log(`Polling for image-to-image ${imageIndex} using official API pattern...`)
      let attempts = 0
      const maxAttempts = 60
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const resultResponse = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`, {
          headers: {
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
          }
        })
        
        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultResponse.status}`)
        }
        
        const resultData = await resultResponse.json()
        
        if (resultData.data?.status === 'completed' && resultData.data?.outputs && resultData.data.outputs.length > 0) {
          console.log(`Image-to-image ${imageIndex} generated successfully`)
          const output = resultData.data.outputs[0]
          return {
            url: typeof output === 'string' ? output : (output.url || output.image_url || output),
            index: imageIndex
          }
        } else if (resultData.data?.status === 'failed') {
          throw new Error(resultData.data?.error || 'Image-to-image generation failed')
        }
        
        attempts++
      }
      
      throw new Error('Image-to-image generation timeout')
    } else {
      // Handle direct response
      if (responseData.code === 200 && responseData.data?.outputs?.length > 0) {
        console.log(`Image-to-image ${imageIndex} generated successfully`)
        return {
          url: responseData.data.outputs[0].url || responseData.data.outputs[0],
          index: imageIndex
        }
      } else {
        throw new Error('No image generated from base image')
      }
    }
  } catch (error) {
    console.error(`Image-to-image ${imageIndex} generation failed:`, error)
    throw error
  }
}

// Helper function to generate a single image
async function generateSingleImage({
  prompt,
  size,
  enableBase64Output,
  enableSyncMode,
  consistencyLevel,
  imageIndex,
  totalImages
}: {
  prompt: string
  size: string
  enableBase64Output: boolean
  enableSyncMode: boolean
  consistencyLevel: string
  imageIndex: number
  totalImages: number
}) {
  console.log(`Generating image ${imageIndex}/${totalImages}...`)
  
  try {
    const response = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        size,
        max_images: 1,
        enable_base64_output: enableBase64Output,
        enable_sync_mode: false, // Use async mode for better reliability
        consistency_level: consistencyLevel
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }
    
    const responseData = await response.json()
    
    // Handle async response using official API pattern
    if (responseData.data?.id) {
      const requestId = responseData.data.id
      console.log(`Polling for image ${imageIndex} using official API pattern...`)
      let attempts = 0
      const maxAttempts = 60
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const resultResponse = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`, {
          headers: {
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
          }
        })
        
        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultResponse.status}`)
        }
        
        const resultData = await resultResponse.json()
        
        if (resultData.data?.status === 'completed' && resultData.data?.outputs && resultData.data.outputs.length > 0) {
          console.log(`Image ${imageIndex} generated successfully`)
          const output = resultData.data.outputs[0]
          return {
            url: typeof output === 'string' ? output : (output.url || output.image_url || output),
            index: imageIndex
          }
        } else if (resultData.data?.status === 'failed') {
          throw new Error(resultData.data?.error || 'Generation failed')
        }
        
        attempts++
      }
      
      throw new Error('Generation timeout')
    } else {
      // Handle direct response
      if (responseData.code === 200 && responseData.data?.outputs?.length > 0) {
        console.log(`Image ${imageIndex} generated successfully`)
        return {
          url: responseData.data.outputs[0].url || responseData.data.outputs[0],
          index: imageIndex
        }
      } else {
        throw new Error('No image generated')
      }
    }
  } catch (error) {
    console.error(`Image ${imageIndex} generation failed:`, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 === PLAYGROUND GENERATION API STARTED ===')
  console.log('📅 Timestamp:', new Date().toISOString())
  
  // Get auth token from header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.log('No authorization header provided')
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    )
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  // Create two clients: one for user auth, one for admin operations
  const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  // Set the user's session to verify the token
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
  
  if (authError || !user) {
    console.error('Auth error:', authError)
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }

  console.log('👤 User authenticated:', { 
    userId: user?.id, 
    hasUser: !!user,
    userEmail: user?.email 
  })

  try {
  
  const requestBody = await request.json()
  const { prompt, style, resolution, consistencyLevel, projectId, maxImages, enableSyncMode, enableBase64Output, customStylePreset, baseImage, generationMode, intensity, cinematicParameters, enhancedPrompt, includeTechnicalDetails, includeStyleReferences, selectedProvider } = requestBody
  
  console.log('📝 Generation request:', {
    prompt: prompt?.substring(0, 100) + (prompt?.length > 100 ? '...' : ''),
    style,
    resolution,
    consistencyLevel,
    projectId,
    maxImages,
    generationMode,
    hasBaseImage: !!baseImage,
    baseImageUrl: baseImage ? baseImage.substring(0, 50) + '...' : 'none',
    hasCustomStylePreset: !!customStylePreset,
    intensity,
    selectedProvider: selectedProvider || 'seedream', // Default to seedream for backward compatibility
    requestBodyKeys: Object.keys(requestBody)
  })

  // Debug provider selection specifically for image-to-image
  if (generationMode === 'image-to-image' && baseImage) {
    console.log('🖼️ Image-to-Image Request Debug:', {
      generationMode,
      hasBaseImage: !!baseImage,
      baseImageUrl: baseImage.substring(0, 50) + '...',
      selectedProvider: selectedProvider || 'seedream',
      willUseNanoBanana: selectedProvider === 'nanobanana',
      willUseSeedream: !selectedProvider || selectedProvider === 'seedream'
    })
  }
  
  // Parse resolution from frontend (format: "1024*576" or "1024")
  let finalResolution: string
  let resolutionForValidation: string
  
  if (resolution && resolution.includes('*')) {
    // Resolution is in format "1024*576" - keep original format for API
    finalResolution = resolution
    resolutionForValidation = resolution.replace('*', 'x')
  } else {
    // Resolution is a single number - create square dimensions
    const baseResolution = parseInt(resolution || '1024')
    finalResolution = `${baseResolution}*${baseResolution}`
    resolutionForValidation = `${baseResolution}x${baseResolution}`
  }
  
  // Parse dimensions for validation using x format
  const [width, height] = resolutionForValidation.split('x').map(Number)
  const aspectRatio = `${width}:${height}`
  
  // Check for known Seedream API limitations
  const isSquareAspectRatio = aspectRatio === '1:1'
  const isMultipleImages = (maxImages || 1) > 1
  
  // Seedream API requires minimum 921600 pixels (960×960) and supports up to 4K resolution
  const minSize = 960
  const maxSize = 4096 // 4K resolution limit
  
  // Ensure minimum size requirement
  if (width < minSize || height < minSize) {
    const scaleFactor = minSize / Math.min(width, height)
    const newWidth = Math.round(width * scaleFactor)
    const newHeight = Math.round(height * scaleFactor)
    console.log(`Adjusting resolution from ${width}x${height} to ${newWidth}x${newHeight} to meet Seedream minimum requirements`)
    finalResolution = `${newWidth}*${newHeight}`
  } else if (width > maxSize || height > maxSize) {
    const scaleFactor = maxSize / Math.max(width, height)
    const newWidth = Math.round(width * scaleFactor)
    const newHeight = Math.round(height * scaleFactor)
    console.log(`Adjusting resolution from ${width}x${height} to ${newWidth}x${newHeight} to meet Seedream maximum requirements (4K limit)`)
    finalResolution = `${newWidth}*${newHeight}`
  }
  
  console.log(`Final resolution for Seedream API: ${finalResolution}`)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  try {
    // Calculate credits needed (2 credits per image)
    let creditsNeeded = (maxImages || 1) * 2
    console.log('💰 Credits calculation:', { 
      maxImages: maxImages || 1, 
      creditsNeeded,
      creditsPerImage: 2 
    })
    
    // Check user credits
    console.log('🔍 Checking user credits for user:', user.id)
    const { data: userCredits, error: creditsQueryError } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, consumed_this_month, subscription_tier')
      .eq('user_id', user.id)
      .single()
    
    console.log('💳 User credits query result:', { 
      userCredits, 
      creditsQueryError,
      hasCredits: !!userCredits,
      currentBalance: userCredits?.current_balance,
      consumedThisMonth: userCredits?.consumed_this_month,
      subscriptionTier: userCredits?.subscription_tier
    })
    
    if (creditsQueryError) {
      console.error('❌ Credits query failed:', creditsQueryError)
      throw new Error(`Failed to check user credits: ${creditsQueryError.message}`)
    }
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      console.log('❌ Insufficient credits:', {
        currentBalance: userCredits?.current_balance || 0,
        creditsNeeded,
        shortfall: creditsNeeded - (userCredits?.current_balance || 0)
      })
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${maxImages || 1} image(s).` },
        { status: 403 }
      )
    }
    
    console.log('✅ Credits check passed:', {
      currentBalance: userCredits.current_balance,
      creditsNeeded,
      remainingAfter: userCredits.current_balance - creditsNeeded
    })
    
    // Enhance prompt with style information
    let stylePrompt: string
    let enhancedPrompt: string
    
    if (customStylePreset) {
      // Use custom style preset
      stylePrompt = customStylePreset.prompt_template.replace('{style_type}', customStylePreset.style_type)
      
      // Apply intensity to the style prompt
      const intensityValue = intensity || customStylePreset.intensity || 1.0
      const intensityModifier = intensityValue !== 1.0 ? ` (intensity: ${intensityValue})` : ''
      
      enhancedPrompt = `${prompt}, ${stylePrompt}${intensityModifier}`
      
      // Update usage count for the preset
      await supabaseAdmin
        .from('playground_style_presets')
        .update({ usage_count: customStylePreset.usage_count + 1 })
        .eq('id', customStylePreset.id)
    } else {
      // Use context-aware style prompts based on generation mode
      const getContextAwareStylePrompt = (styleType: string, mode: 'text-to-image' | 'image-to-image') => {
        const prompts = {
          'photorealistic': {
            'text-to-image': 'photorealistic, high quality, detailed, natural lighting',
            'image-to-image': 'photorealistic rendering, natural lighting, detailed textures'
          },
          'artistic': {
            'text-to-image': 'artistic style, creative interpretation, painterly, expressive',
            'image-to-image': 'artistic painting style, creative brushstrokes, expressive'
          },
          'cartoon': {
            'text-to-image': 'cartoon style, animated, colorful, simplified features',
            'image-to-image': 'cartoon-style illustration, bold outlines, bright colors'
          },
          'vintage': {
            'text-to-image': 'vintage aesthetic, retro colors, nostalgic atmosphere',
            'image-to-image': 'vintage aesthetic, retro colors, nostalgic atmosphere'
          },
          'cyberpunk': {
            'text-to-image': 'cyberpunk style, neon lights, futuristic, high-tech',
            'image-to-image': 'cyberpunk style, neon lights, futuristic elements'
          },
          'watercolor': {
            'text-to-image': 'watercolor painting, soft flowing colors, translucent effects',
            'image-to-image': 'watercolor painting technique, soft flowing colors, translucent'
          },
          'sketch': {
            'text-to-image': 'pencil sketch, detailed line work, shading',
            'image-to-image': 'pencil sketch style, detailed line work, shading'
          },
          'oil_painting': {
            'text-to-image': 'oil painting, rich textures, classical art style',
            'image-to-image': 'oil painting technique, rich textures, classical style'
          }
        }
        
        return prompts[styleType as keyof typeof prompts]?.[mode] || prompts.photorealistic[mode]
      }
      
      const currentMode = generationMode || 'text-to-image'
      stylePrompt = getContextAwareStylePrompt(style, currentMode)
      
      // Apply intensity to the style prompt
      const intensityValue = intensity || 1.0
      const intensityModifier = intensityValue !== 1.0 ? ` (intensity: ${intensityValue})` : ''
      
      enhancedPrompt = `${prompt}, ${stylePrompt}${intensityModifier}`
    }
    
    // Determine generation mode and call appropriate API
    const isImageToImage = generationMode === 'image-to-image' && baseImage
    const apiEndpoint = isImageToImage 
      ? 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit'
      : 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4'
    
    console.log('🎨 Enhanced prompt details:', {
      originalPrompt: prompt?.substring(0, 100) + '...',
      enhancedPrompt: enhancedPrompt?.substring(0, 100) + '...',
      styleApplied: style,
      stylePrompt: stylePrompt,
      consistencyLevel,
      intensity: intensity || 1.0,
      generationMode: isImageToImage ? 'image-to-image' : 'text-to-image',
      hasBaseImage: !!baseImage,
      apiEndpoint
    })
    
    console.log('🔧 API Configuration:', {
      hasWavespeedApiKey: !!process.env.WAVESPEED_API_KEY,
      apiKeyPrefix: process.env.WAVESPEED_API_KEY?.substring(0, 10) + '...',
      finalResolution,
      aspectRatio,
      maxImages: maxImages || 1,
      enableSyncMode,
      enableBase64Output
    })
    
    // Temporary mock response for testing
    const isTestMode = process.env.NODE_ENV === 'development' && prompt.includes('test')
    let seedreamData
    
    if (isTestMode) {
      console.log('Using mock response for testing')
      seedreamData = {
        code: 200,
        data: {
          outputs: [
            `https://via.placeholder.com/1024x1024/FF6B6B/FFFFFF?text=${encodeURIComponent(style)}-Style-1`,
            `https://via.placeholder.com/1024x1024/4ECDC4/FFFFFF?text=${encodeURIComponent(style)}-Style-2`
          ]
        }
      }
    } else {
      // Calculate dimensions for logging
      const [width, height] = finalResolution.split('*').map(Number)
      const calculatedAspectRatio = width / height
      console.log(`Aspect ratio: ${calculatedAspectRatio.toFixed(2)} (${width}:${height})`)
      console.log(`Using Seedream resolution format: ${finalResolution}`)
      
      // Seedream API limitations:
      // 1. Multiple images only work with 1:1 aspect ratio
      // 2. Non-square aspect ratios are supported for single images
      if (!isSquareAspectRatio) {
        console.log(`Using non-square aspect ratio: ${finalResolution}`)
      }
      
      // For multiple images, we need to use square aspect ratio
      let resolutionForGeneration = finalResolution
      if (isMultipleImages && !isSquareAspectRatio) {
        console.log('WARNING: Multiple images with non-square aspect ratios are not supported')
        console.log('Using square aspect ratio for multiple image generation')
        const baseSize = Math.min(width, height) // Use the smaller dimension for square
        resolutionForGeneration = `${baseSize}*${baseSize}`
      }
      
      // For multiple images, generate them individually in the background
      if (isMultipleImages) {
        console.log(`Generating ${maxImages} images individually using resolution: ${resolutionForGeneration}`)
        
        const imagePromises = []
        for (let i = 0; i < (maxImages || 1); i++) {
          // Use selected provider or default to seedream
          const provider = selectedProvider || 'seedream'
          
          if (provider === 'nanobanana') {
            console.log('🔍 NanoBanana batch generation debug:', {
              provider,
              imageIndex: i + 1,
              isImageToImage,
              hasBaseImage: !!baseImage,
              baseImageUrl: baseImage ? baseImage.substring(0, 50) + '...' : 'none',
              generationMode: isImageToImage ? 'image-to-image' : 'text-to-image',
              prompt: enhancedPrompt.substring(0, 50) + '...'
            })
            
            imagePromises.push(
              generateWithWaveSpeedNanoBanana({
                prompt: enhancedPrompt,
                baseImage: baseImage,
                size: resolutionForGeneration,
                enableBase64Output: enableBase64Output || false,
                enableSyncMode: enableSyncMode !== false,
                consistencyLevel: consistencyLevel || 'high',
                imageIndex: i + 1,
                totalImages: maxImages || 1,
                generationMode: isImageToImage ? 'image-to-image' : 'text-to-image'
              })
            )
          } else {
            // Use Seedream (existing logic)
            if (isImageToImage) {
              imagePromises.push(
                generateSingleImageToImage({
                  prompt: enhancedPrompt,
                  baseImage: baseImage!,
                  size: resolutionForGeneration,
                  enableBase64Output: enableBase64Output || false,
                  enableSyncMode: enableSyncMode !== false,
                  consistencyLevel: consistencyLevel || 'high',
                  imageIndex: i + 1,
                  totalImages: maxImages || 1
                })
              )
            } else {
              imagePromises.push(
                generateSingleImage({
                  prompt: enhancedPrompt,
                  size: resolutionForGeneration,
                  enableBase64Output: enableBase64Output || false,
                  enableSyncMode: enableSyncMode !== false,
                  consistencyLevel: consistencyLevel || 'high',
                  imageIndex: i + 1,
                  totalImages: maxImages || 1
                })
              )
            }
          }
        }
        
        // Wait for all images to be generated
        const imageResults = await Promise.allSettled(imagePromises)
        
        // Process results
        const successfulImages: Array<{ url: string; index: number; provider?: string; cost?: number; taskId?: string; isCallback?: boolean }> = []
        const failedImages: Array<{ index: number; error: any }> = []
        
        imageResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            // Check if it's a WaveSpeed NanoBanana result with taskId and imageUrl
            if ('success' in result.value && result.value.success && 'taskId' in result.value) {
              // WaveSpeed NanoBanana result - may have immediate imageUrl or need polling
              console.log(`WaveSpeed NanoBanana task ${index + 1}:`, result.value.taskId, result.value.imageUrl ? 'with image' : 'processing')
              successfulImages.push({
                url: result.value.imageUrl as string || '', // May be immediate or empty for async
                index: index + 1,
                provider: 'wavespeed-nanobanan',
                cost: result.value.cost || 0.025,
                taskId: result.value.taskId as string,
                isCallback: !result.value.imageUrl // Only callback if no immediate URL
              })
            } else if ('success' in result.value && result.value.success && 'imageUrl' in result.value) {
              // Legacy immediate result format
              successfulImages.push({
                url: result.value.imageUrl as string,
                index: index + 1,
                provider: 'provider' in result.value ? result.value.provider : undefined,
                cost: 'cost' in result.value ? result.value.cost : undefined
              })
            } else if ('url' in result.value) {
              // Seedream result format
              successfulImages.push({
                url: result.value.url,
                index: result.value.index || index + 1
              })
            }
          } else {
            const error = result.status === 'rejected' ? result.reason : 'Unknown error'
            failedImages.push({ index: index + 1, error })
            console.error(`Image ${index + 1} generation failed:`, error)
          }
        })
        
        console.log(`Generated ${successfulImages.length}/${maxImages} images successfully`)
        
        if (successfulImages.length === 0) {
          throw new Error('All image generations failed')
        }
        
        // Separate immediate results from callback-based results
        const immediateResults = successfulImages.filter(img => !img.isCallback)
        const callbackResults = successfulImages.filter(img => img.isCallback)
        
        console.log(`Immediate results: ${immediateResults.length}, Callback results: ${callbackResults.length}`)
        
        // For callback-based results, we need to handle them differently
        if (callbackResults.length > 0) {
          console.log('NanoBanana tasks submitted, images will come via callback')
          // Store callback task info in database for later processing - use same table as Seedream
          for (const callbackResult of callbackResults) {
            if (callbackResult.taskId) {
              // Store in playground_projects table just like Seedream does
              await supabaseAdmin
                .from('playground_projects')
                .insert({
                  user_id: user.id,
                  title: enhancedPrompt.substring(0, 50),
                  prompt: enhancedPrompt,
                  style: style || 'photorealistic',
                  aspect_ratio: aspectRatio,
                  resolution: resolutionForGeneration,
                  generated_images: [], // Will be filled by callback
                  credits_used: 1, // NanoBanana costs 1 credit
                  status: 'processing',
                  last_generated_at: new Date().toISOString(),
                  metadata: {
                    provider: 'nanobanana',
                    taskId: callbackResult.taskId,
                    generation_mode: isImageToImage ? 'image-to-image' : 'text-to-image',
                    cinematic_parameters: cinematicParameters,
                    enhanced_prompt: enhancedPrompt,
                    include_technical_details: includeTechnicalDetails,
                    include_style_references: includeStyleReferences,
                    base_image: baseImage || null
                  }
                })
            }
          }
        }
        
        // Adjust credits based on successful generations
        creditsNeeded = successfulImages.length * 2
        
        // Create mock seedreamData structure for immediate results
        seedreamData = {
          code: 200,
          data: {
            outputs: immediateResults.map(img => img.url)
          }
        }
        
        // Add warning if some images failed
        if (failedImages.length > 0) {
          console.log(`Warning: ${failedImages.length} images failed to generate`)
        }
        
      } else {
        // Single image generation with provider selection
        const provider = selectedProvider || 'seedream'
        console.log(`Using provider: ${provider} for single image generation`)
        
        if (provider === 'nanobanana') {
          console.log('🔍 NanoBanana single generation debug:', {
            provider,
            isImageToImage,
            hasBaseImage: !!baseImage,
            baseImageUrl: baseImage ? baseImage.substring(0, 50) + '...' : 'none',
            generationMode: isImageToImage ? 'image-to-image' : 'text-to-image',
            prompt: enhancedPrompt.substring(0, 50) + '...'
          })
          
          // Use NanoBanana for single image generation
          const result = await generateWithWaveSpeedNanoBanana({
            prompt: enhancedPrompt,
            baseImage: baseImage,
            size: finalResolution,
            enableBase64Output: enableBase64Output || false,
            enableSyncMode: enableSyncMode !== false,
            consistencyLevel: consistencyLevel || 'high',
            imageIndex: 1,
            totalImages: 1,
            generationMode: isImageToImage ? 'image-to-image' : 'text-to-image'
          })
          
          if (result.success) {
            // Handle WaveSpeed response - image URL is available immediately
            if (result.taskId) {
              // Store in playground_projects table with generated image
              const projectData = {
                user_id: user.id,
                title: enhancedPrompt.substring(0, 50),
                prompt: enhancedPrompt,
                style: style || 'photorealistic',
                aspect_ratio: aspectRatio,
                resolution: finalResolution,
                generated_images: result.imageUrl ? [{
                  url: result.imageUrl,
                  width: 1024,
                  height: 1024,
                  generated_at: new Date().toISOString(),
                  type: 'image'
                }] : [],
                credits_used: 1, // WaveSpeed NanoBanana costs 1 credit
                status: result.imageUrl ? 'generated' : 'processing',
                last_generated_at: new Date().toISOString(),
                metadata: {
                  provider: result.provider,
                  taskId: result.taskId,
                  generation_mode: isImageToImage ? 'image-to-image' : 'text-to-image',
                  cinematic_parameters: cinematicParameters,
                  enhanced_prompt: enhancedPrompt,
                  include_technical_details: includeTechnicalDetails,
                  include_style_references: includeStyleReferences,
                  base_image: baseImage || null
                }
              }
              
              const { data: generationData, error: insertError } = await supabaseAdmin
                .from('playground_projects')
                .insert(projectData)
                .select()
                .single()
              
              if (insertError) {
                console.error('❌ Error storing generation task:', {
                  error: insertError,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                  code: insertError.code,
                  projectData: JSON.stringify(projectData, null, 2),
                  userId: user.id,
                  userEmail: user.email
                })
                throw new Error(`Failed to store generation task: ${insertError.message}`)
              } else {
                console.log('✅ Generation task stored successfully:', generationData.id)
              }
              
              return NextResponse.json({
                success: true,
                project: generationData, // Frontend expects project object
                images: result.imageUrl ? [{
                  url: result.imageUrl,
                  width: 1024,
                  height: 1024,
                  generated_at: new Date().toISOString(),
                  type: 'image'
                }] : [],
                creditsUsed: creditsNeeded,
                taskId: result.taskId,
                provider: result.provider,
                status: result.imageUrl ? 'generated' : 'processing',
                message: result.imageUrl ? `WaveSpeed NanoBanana ${isImageToImage ? 'image edit' : 'image generation'} completed successfully!` : `WaveSpeed NanoBanana ${isImageToImage ? 'image edit' : 'image generation'} task submitted successfully.`
              })
            } else if ('imageUrl' in result && result.imageUrl) {
              // Legacy immediate response - use same table as Seedream
              const projectData = {
                user_id: user.id,
                title: enhancedPrompt.substring(0, 50),
                prompt: enhancedPrompt,
                style: style || 'photorealistic',
                aspect_ratio: aspectRatio,
                resolution: finalResolution,
                generated_images: [{
                  url: result.imageUrl,
                  width: parseInt(finalResolution.split('*')[0] || '1024'),
                  height: parseInt(finalResolution.split('*')[1] || '1024'),
                  generated_at: new Date().toISOString()
                }],
                credits_used: 1, // NanoBanana costs 1 credit
                status: 'generated',
                last_generated_at: new Date().toISOString(),
                metadata: {
                  provider: result.provider,
                  cost: result.cost,
                  generation_mode: isImageToImage ? 'image-to-image' : 'text-to-image',
                  cinematic_parameters: cinematicParameters,
                  enhanced_prompt: enhancedPrompt,
                  include_technical_details: includeTechnicalDetails,
                  include_style_references: includeStyleReferences,
                  base_image: baseImage || null
                }
              }
              
              const { data: generationData, error: insertError } = await supabaseAdmin
                .from('playground_projects')
                .insert(projectData)
                .select()
                .single()
              
              if (insertError) {
                console.error('Error storing generation:', insertError)
                // Don't throw - we still want to return the image
              } else {
                console.log('Generation stored successfully:', generationData.id)
              }
              
                return NextResponse.json({
                  success: true,
                  project: generationData, // Frontend expects project object
                  images: [{ url: result.imageUrl, width: 1024, height: 1024 }],
                  creditsUsed: creditsNeeded,
                  provider: result.provider,
                  cost: result.cost,
                  message: 'Image generated successfully with NanoBanana'
                })
            }
          } else {
            throw new Error(result.error || 'NanoBanana generation failed')
          }
        } else {
          // Use Seedream (existing logic)
          console.log('Making Seedream API call with:', {
            prompt: enhancedPrompt.substring(0, 100) + '...',
            fullPrompt: enhancedPrompt,
            size: finalResolution,
            max_images: 1,
            enable_sync_mode: enableSyncMode !== false,
            hasApiKey: !!process.env.WAVESPEED_API_KEY,
            aspectRatio: aspectRatio,
            originalResolution: resolution,
            calculatedAspectRatio: calculatedAspectRatio,
            mode: 'sync (single image)',
            seedreamFormat: 'x format (e.g., 1024x1024)'
          })
        
        console.log(`Using final resolution: ${finalResolution}`)
        
        const requestBody = isImageToImage 
          ? {
              prompt: enhancedPrompt,
              images: [baseImage!],
              size: finalResolution,
              enable_base64_output: enableBase64Output || false,
              enable_sync_mode: false // Use async mode for better reliability
            }
          : {
              prompt: enhancedPrompt,
              size: finalResolution,
              max_images: 1,
              enable_base64_output: enableBase64Output || false,
              enable_sync_mode: false, // Use async mode for better reliability
              consistency_level: consistencyLevel || 'high'
            }

        const seedreamResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        console.log('Seedream API response status:', seedreamResponse.status)
        
        if (!seedreamResponse.ok) {
          const errorText = await seedreamResponse.text()
          console.error('Seedream API error response:', errorText)
          
          // Handle platform credit issues gracefully
          if (errorText.includes('Insufficient credits') || errorText.includes('top up')) {
            throw new Error('Image generation service is temporarily unavailable. Please try again in a few minutes.')
          }
          
          throw new Error(`Seedream API error: ${seedreamResponse.status} - ${errorText}`)
        }
        
        const seedreamResponseData = await seedreamResponse.json()
        console.log('Seedream API response data:', seedreamResponseData)
        
        // Handle async response - poll for results using official API pattern
        if (seedreamResponseData.data?.id) {
          const requestId = seedreamResponseData.data.id
          console.log('🔄 Polling for async results using official API pattern...', {
            requestId,
            requestedImages: 1,
            mode: 'async',
            apiEndpoint: 'https://api.wavespeed.ai/api/v3/predictions/' + requestId + '/result'
          })
          
          let attempts = 0
          const maxAttempts = 60 // 60 seconds timeout (increased for reliability)
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
            
            const resultResponse = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`, {
              headers: {
                'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
              }
            })
            
            if (!resultResponse.ok) {
              throw new Error(`Failed to fetch results: ${resultResponse.status}`)
            }
            
            const resultData = await resultResponse.json()
            console.log(`⏳ Polling attempt ${attempts + 1}/${maxAttempts}:`, {
              status: resultData.data?.status,
              outputsCount: resultData.data?.outputs?.length || 0,
              requestedImages: 1,
              hasOutputs: !!resultData.data?.outputs,
              requestId,
              elapsedSeconds: attempts + 1
            })
            
            if (resultData.data?.status === 'completed' && resultData.data?.outputs && resultData.data.outputs.length > 0) {
              console.log(`Async generation succeeded with ${resultData.data.outputs.length} images (requested: 1)`)
              console.log('Raw outputs from Seedream API:', resultData.data.outputs)
              // Transform the response to match expected format
              seedreamData = {
                code: 200,
                data: {
                  outputs: resultData.data.outputs.map((output: any) => {
                    // Handle different response formats
                    if (typeof output === 'string') {
                      return output // Direct URL string
                    } else if (output.url) {
                      return output.url // Object with url property
                    } else if (output.image_url) {
                      return output.image_url // Object with image_url property
                    } else {
                      return output // Fallback to original
                    }
                  })
                }
              }
              break
            } else if (resultData.data?.status === 'failed') {
              console.error('Async generation failed:', resultData.data?.error)
              throw new Error(resultData.data?.error || 'Generation failed')
            }
            
            attempts++
          }
          
          if (attempts >= maxAttempts) {
            throw new Error('Generation timeout - please try again')
          }
        } else {
          // Handle direct response (if sync mode actually works)
          seedreamData = seedreamResponseData
        }
      }
    }
    
    // Check if generation was successful
    console.log('Seedream response analysis:', {
      code: seedreamData.code,
      hasData: !!seedreamData.data,
      hasOutputs: !!seedreamData.data?.outputs,
      outputsLength: seedreamData.data?.outputs?.length,
      message: seedreamData.message,
      status: seedreamData.status,
      fullResponse: seedreamData
    })
    
    // Additional debugging for single image case
    if (seedreamData.data?.outputs?.length === 1) {
      console.log('Single image generated successfully:', {
        imageUrl: seedreamData.data.outputs[0],
        requestedImages: maxImages || 1,
        aspectRatio: aspectRatio,
        resolution: resolution
      })
      
      // Check if this is a partial success (requested multiple but got one)
      if ((maxImages || 1) > 1) {
        console.log('WARNING: Only 1 image generated when', maxImages, 'were requested.')
        console.log('Mode used: sync (single image)')
        console.log('This might be a Seedream API limitation or the async mode needs more time.')
        console.log('Adjusting credit cost to reflect actual images generated (1 instead of', maxImages, ')')
        
        // Adjust the credit cost to reflect only 1 image generated
        const actualCreditsUsed = 2 // 2 credits for 1 image
        console.log('Credits will be adjusted from', creditsNeeded, 'to', actualCreditsUsed)
        
        // Update the creditsNeeded variable for the rest of the function
        creditsNeeded = actualCreditsUsed
      }
    }
    
    if (seedreamData.code !== 200 || !seedreamData.data.outputs || seedreamData.data.outputs.length === 0) {
      console.error('Seedream generation failed:', seedreamData)
      
      // Provide more specific error messages based on the response
      if (seedreamData.code !== 200) {
        throw new Error(`Image generation failed: Service returned status ${seedreamData.code}`)
      } else if (!seedreamData.data) {
        throw new Error('Image generation failed: No data returned from service')
      } else if (!seedreamData.data.outputs) {
        throw new Error('Image generation failed: No outputs in response')
      } else if (seedreamData.data.outputs.length === 0) {
        console.error('Empty outputs array - possible causes:', {
          prompt: enhancedPrompt.substring(0, 200) + '...',
          promptLength: enhancedPrompt.length,
          hasStylePreset: !!customStylePreset,
          consistencyLevel,
          maxImages,
          enableSyncMode
        })
        // Check if there's a specific error message from the API
        const apiMessage = seedreamData.message || seedreamData.error || 'No images were generated'
        
        // Handle the specific case where API returns "success" but no outputs
        if (apiMessage === 'success') {
          console.error('Empty outputs with success message - debugging info:', {
            prompt: enhancedPrompt.substring(0, 200),
            resolution: resolution || '1024*1024',
            aspectRatio: aspectRatio,
            maxImages,
            style: style,
            fullSeedreamResponse: seedreamData
          })
          throw new Error('Image generation failed: The service processed your request but did not generate any images. This often happens when requesting multiple images - the API may have limitations. Try: 1) Requesting 1 image instead of multiple, 2) Simplifying your prompt, 3) Using different aspect ratios, or 4) Trying a different style.')
        } else {
          throw new Error(`Image generation failed: ${apiMessage}. This might be due to content policy restrictions or service limitations. Please try a different prompt.`)
        }
      } else {
        throw new Error('Image generation failed: Invalid response from generation service')
      }
    }
    }
    
    // Deduct credits
    console.log('💸 Deducting credits:', {
      userId: user.id,
      currentBalance: userCredits.current_balance,
      creditsNeeded,
      newBalance: userCredits.current_balance - creditsNeeded,
      newConsumedThisMonth: userCredits.consumed_this_month + creditsNeeded
    })
    
    const { error: creditError } = await supabaseAdmin
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    if (creditError) {
      console.error('❌ Credit deduction failed:', creditError)
      throw new Error(`Credit deduction failed: ${creditError.message}`)
    }
    console.log('✅ Credits deducted successfully')
    
    // Save or update project
    const projectData = {
      user_id: user.id,
      title: prompt.substring(0, 50),
      prompt, // Store original prompt
      style,
      aspect_ratio: aspectRatio,
      resolution,
      generated_images: seedreamData.data.outputs.map((imgUrl: string, index: number) => ({
        url: imgUrl,
        width: parseInt(finalResolution.split('*')[0] || '1024'),
        height: parseInt(finalResolution.split('*')[1] || '1024'),
        generated_at: new Date().toISOString()
      })),
      credits_used: creditsNeeded,
      status: 'generated',
      last_generated_at: new Date().toISOString(),
      metadata: {
        enhanced_prompt: enhancedPrompt,
        style_applied: style,
        style_prompt: stylePrompt,
        consistency_level: consistencyLevel || 'high',
        intensity: intensity || (customStylePreset ? customStylePreset.intensity : 1.0),
        custom_style_preset: customStylePreset ? {
          id: customStylePreset.id,
          name: customStylePreset.name,
          style_type: customStylePreset.style_type,
          intensity: customStylePreset.intensity
        } : null,
        generation_mode: generationMode || 'text-to-image',
        base_image: baseImage || null,
        api_endpoint: isImageToImage ? 'seedream-v4/edit' : 'seedream-v4',
        cinematic_parameters: cinematicParameters || null,
        include_technical_details: includeTechnicalDetails ?? true,
        include_style_references: includeStyleReferences ?? true
      }
    }
    
    let project
    console.log('💾 Saving project data:', { 
      projectId, 
      userId: user.id,
      hasProjectId: !!projectId,
      operation: projectId ? 'UPDATE' : 'INSERT'
    })
    
    console.log('📊 Project data to save:', {
      title: projectData.title,
      prompt: projectData.prompt?.substring(0, 50) + '...',
      style: projectData.style,
      aspectRatio: projectData.aspect_ratio,
      resolution: projectData.resolution,
      generatedImagesCount: projectData.generated_images?.length,
      creditsUsed: projectData.credits_used,
      status: projectData.status,
      hasMetadata: !!projectData.metadata
    })
    
    if (projectId) {
      console.log('🔄 Updating existing project:', projectId)
      const { data, error } = await supabaseAdmin
        .from('playground_projects')
        .update(projectData)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Project update failed:', error)
        console.error('❌ Update error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Project update failed: ${error.message}`)
      }
      project = data
      console.log('✅ Project updated successfully:', { projectId: project.id })
    } else {
      console.log('🆕 Creating new project')
      const { data, error } = await supabaseAdmin
        .from('playground_projects')
        .insert(projectData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Project insert failed:', error)
        console.error('❌ Insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Project insert failed: ${error.message}`)
      }
      project = data
      console.log('✅ Project created successfully:', { projectId: project.id })
    }
    
    // Generate appropriate warnings based on limitations
    let warning = null
    
    // Check if we converted the resolution to square format
    const [finalWidth, finalHeight] = finalResolution.split('*').map(Number)
    const finalAspectRatio = `${finalWidth}:${finalHeight}`
    const wasConvertedToSquare = !isSquareAspectRatio && finalAspectRatio === '1:1'
    
    if (wasConvertedToSquare) {
      warning = `Note: The ${aspectRatio} aspect ratio was automatically converted to 1:1 (square) as it's not supported by the image generation service.`
    } else if ((maxImages || 1) > 1 && seedreamData.data.outputs.length === 1) {
      warning = `Note: Only 1 image was generated instead of ${maxImages} requested. Multiple images are only supported with 1:1 aspect ratio. Credits have been adjusted accordingly.`
    } else if (!isSquareAspectRatio && isMultipleImages) {
      warning = `Note: Multiple images with ${aspectRatio} aspect ratio are not supported. Generated 1 image with 1:1 aspect ratio instead.`
    }
    
    const responseImages = seedreamData.data.outputs.map((imgUrl: string) => ({
      url: imgUrl,
      width: parseInt(finalResolution.split('*')[0] || '1024'),
      height: parseInt(finalResolution.split('*')[1] || '1024')
    }))
    
    console.log('🎉 === GENERATION COMPLETED SUCCESSFULLY ===')
    console.log('📸 Final response images:', responseImages)
    console.log('💾 Project saved:', { 
      projectId: project.id,
      projectTitle: project.title,
      projectStatus: project.status
    })
    console.log('💰 Credits used:', creditsNeeded)
    console.log('⚠️ Warning:', warning)
    
    const finalResponse = { 
      success: true, 
      project,
      images: responseImages,
      creditsUsed: creditsNeeded,
      warning: warning
    }
    
    console.log('📤 Sending response to client:', {
      success: finalResponse.success,
      projectId: finalResponse.project?.id,
      imagesCount: finalResponse.images?.length,
      creditsUsed: finalResponse.creditsUsed,
      hasWarning: !!finalResponse.warning
    })
    
    return NextResponse.json(finalResponse)
  } catch (innerError) {
    console.error('Inner try block error:', innerError)
    throw innerError // Re-throw to be caught by outer catch
  }
  } catch (error) {
    console.error('💥 === GENERATION FAILED ===')
    console.error('❌ Error occurred:', error)
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString()
    })
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to generate images'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('temporarily unavailable')) {
        userMessage = error.message
        statusCode = 503 // Service Unavailable
      } else if (error.message.includes('Seedream API error')) {
        userMessage = 'Image generation service is experiencing issues. Please try again later.'
        statusCode = 503
      } else {
        userMessage = error.message
      }
    }
    
    return NextResponse.json({ 
      error: userMessage
    }, { status: statusCode })
  }
}
