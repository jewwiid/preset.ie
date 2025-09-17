import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

// Manually load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (from project root)
dotenv.config({ path: path.join(process.cwd(), '../../.env.local') })

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
    console.log(`Generating image-to-image ${imageIndex}/${totalImages}...`)
    console.log('Base image type:', baseImage.startsWith('data:') ? 'base64' : 'url')
    console.log('Base image length:', baseImage.length)
  
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
  const { user } = await getUserFromRequest(request)
  const { prompt, style, resolution, consistencyLevel, projectId, maxImages, enableSyncMode, enableBase64Output, customStylePreset, baseImage, generationMode, intensity, cinematicParameters, enhancedPrompt, includeTechnicalDetails, includeStyleReferences } = await request.json()
  
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
    
    // Check user credits
    const { data: userCredits } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${maxImages || 1} image(s).` },
        { status: 403 }
      )
    }
    
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
    
    console.log(`Calling Seedream API (${isImageToImage ? 'image-to-image' : 'text-to-image'}) with enhanced prompt:`, enhancedPrompt)
    console.log('Style applied:', style, '->', stylePrompt)
    console.log('Consistency level:', consistencyLevel)
    console.log('Intensity:', intensity || 1.0)
    if (isImageToImage) {
      console.log('Base image provided for image-to-image generation')
    }
    
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
        
        // Wait for all images to be generated
        const imageResults = await Promise.allSettled(imagePromises)
        
        // Process results
        const successfulImages: Array<{ url: string; index: number }> = []
        const failedImages: Array<{ index: number; error: any }> = []
        
        imageResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            successfulImages.push(result.value)
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
        
        // Adjust credits based on successful generations
        creditsNeeded = successfulImages.length * 2
        
        // Create mock seedreamData structure
        seedreamData = {
          code: 200,
          data: {
            outputs: successfulImages.map(img => img.url)
          }
        }
        
        // Add warning if some images failed
        if (failedImages.length > 0) {
          console.log(`Warning: ${failedImages.length} images failed to generate`)
        }
        
      } else {
        // Single image generation (original logic)
        const useAsyncMode = false // Always use sync for single images
        
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
          console.log('Polling for async results using official API pattern...', {
            requestId,
            requestedImages: 1,
            mode: 'async'
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
            console.log(`Polling attempt ${attempts + 1}:`, {
              status: resultData.data?.status,
              outputsCount: resultData.data?.outputs?.length || 0,
              requestedImages: 1,
              hasOutputs: !!resultData.data?.outputs,
              fullResponse: resultData
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
    
    // Deduct credits
    console.log('Deducting credits for user:', user.id)
    const { error: creditError } = await supabaseAdmin
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    if (creditError) {
      console.error('Credit deduction failed:', creditError)
      throw new Error(`Credit deduction failed: ${creditError.message}`)
    }
    console.log('Credits deducted successfully')
    
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
    console.log('Saving project data:', { projectId, user_id: user.id })
    
    if (projectId) {
      const { data, error } = await supabaseAdmin
        .from('playground_projects')
        .update(projectData)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) {
        console.error('Project update failed:', error)
        throw new Error(`Project update failed: ${error.message}`)
      }
      project = data
      console.log('Project updated successfully')
    } else {
      const { data, error } = await supabaseAdmin
        .from('playground_projects')
        .insert(projectData)
        .select()
        .single()
      
      if (error) {
        console.error('Project insert failed:', error)
        throw new Error(`Project insert failed: ${error.message}`)
      }
      project = data
      console.log('Project created successfully')
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
    
    console.log('Final API response images:', responseImages)
    
    return NextResponse.json({ 
      success: true, 
      project,
      images: responseImages,
      creditsUsed: creditsNeeded,
      warning: warning
    })
  } catch (error) {
    console.error('Failed to generate images:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
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
