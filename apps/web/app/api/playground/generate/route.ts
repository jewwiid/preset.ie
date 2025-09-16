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
        enable_sync_mode: enableSyncMode
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }
    
    const responseData = await response.json()
    
    // Handle async response if needed
    if (responseData.status === 'created' && responseData.urls?.get) {
      console.log(`Polling for image-to-image ${imageIndex}...`)
      let attempts = 0
      const maxAttempts = 30
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const resultResponse = await fetch(responseData.urls.get, {
          headers: {
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
          }
        })
        
        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultResponse.status}`)
        }
        
        const resultData = await resultResponse.json()
        
        if (resultData.status === 'succeeded' && resultData.outputs && resultData.outputs.length > 0) {
          console.log(`Image-to-image ${imageIndex} generated successfully`)
          return {
            url: resultData.outputs[0].url || resultData.outputs[0].image_url || resultData.outputs[0],
            index: imageIndex
          }
        } else if (resultData.status === 'failed') {
          throw new Error(resultData.error || 'Image-to-image generation failed')
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
        enable_sync_mode: enableSyncMode,
        consistency_level: consistencyLevel
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }
    
    const responseData = await response.json()
    
    // Handle async response if needed
    if (responseData.status === 'created' && responseData.urls?.get) {
      console.log(`Polling for image ${imageIndex}...`)
      let attempts = 0
      const maxAttempts = 30
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const resultResponse = await fetch(responseData.urls.get, {
          headers: {
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
          }
        })
        
        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultResponse.status}`)
        }
        
        const resultData = await resultResponse.json()
        
        if (resultData.status === 'succeeded' && resultData.outputs && resultData.outputs.length > 0) {
          console.log(`Image ${imageIndex} generated successfully`)
          return {
            url: resultData.outputs[0].url || resultData.outputs[0].image_url || resultData.outputs[0],
            index: imageIndex
          }
        } else if (resultData.status === 'failed') {
          throw new Error(resultData.error || 'Generation failed')
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
  const { prompt, style, resolution, consistencyLevel, projectId, maxImages, enableSyncMode, enableBase64Output, customStylePreset, baseImage, generationMode } = await request.json()
  
  // Always use 1:1 aspect ratio for generation since Seedream supports it best
  const aspectRatio = '1:1'
  
  // Check for known Seedream API limitations
  const isSquareAspectRatio = aspectRatio === '1:1'
  const isMultipleImages = (maxImages || 1) > 1
  
  // Seedream API requires minimum 921600 pixels (960×960) and supports up to 4K resolution
  // Convert resolution to proper format for Seedream API
  const baseResolution = parseInt(resolution || '1024')
  let finalResolution = `${baseResolution}x${baseResolution}` // Use 'x' format instead of '*'
  
  // Ensure minimum size requirement (921600 pixels = 960×960)
  const minSize = 960
  const maxSize = 4096 // 4K resolution limit
  
  if (baseResolution < minSize) {
    console.log(`Adjusting resolution from ${baseResolution} to ${minSize} to meet Seedream minimum requirements`)
    finalResolution = `${minSize}x${minSize}`
  } else if (baseResolution > maxSize) {
    console.log(`Adjusting resolution from ${baseResolution} to ${maxSize} to meet Seedream maximum requirements (4K limit)`)
    finalResolution = `${maxSize}x${maxSize}`
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
      enhancedPrompt = `${prompt}, ${stylePrompt}`
      
      // Update usage count for the preset
      await supabaseAdmin
        .from('playground_style_presets')
        .update({ usage_count: customStylePreset.usage_count + 1 })
        .eq('id', customStylePreset.id)
    } else {
      // Use default style prompts
      const stylePrompts = {
        'realistic': 'photorealistic, high quality, detailed, natural lighting',
        'artistic': 'artistic style, creative interpretation, painterly, expressive',
        'cartoon': 'cartoon style, animated, colorful, simplified features',
        'anime': 'anime style, manga art, Japanese animation, stylized',
        'fantasy': 'fantasy art, magical, mystical, ethereal, otherworldly'
      }
      
      stylePrompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.realistic
      enhancedPrompt = `${prompt}, ${stylePrompt}`
    }
    
    // Determine generation mode and call appropriate API
    const isImageToImage = generationMode === 'image-to-image' && baseImage
    const apiEndpoint = isImageToImage 
      ? 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit'
      : 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4'
    
    console.log(`Calling Seedream API (${isImageToImage ? 'image-to-image' : 'text-to-image'}) with enhanced prompt:`, enhancedPrompt)
    console.log('Style applied:', style, '->', stylePrompt)
    console.log('Consistency level:', consistencyLevel)
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
      const [width, height] = finalResolution.split('x').map(Number)
      const calculatedAspectRatio = width / height
      console.log(`Aspect ratio: ${calculatedAspectRatio.toFixed(2)} (${width}:${height})`)
      console.log(`Using Seedream resolution format: ${finalResolution}`)
      
      // Seedream API limitations:
      // 1. Multiple images only work with 1:1 aspect ratio
      // 2. Non-square aspect ratios don't work at all
      if (!isSquareAspectRatio) {
        console.log('WARNING: Non-square aspect ratios are not supported by Seedream API')
        console.log('Falling back to 1:1 aspect ratio for compatibility')
        finalResolution = '1024*1024'
      }
      
      if (!isSquareAspectRatio && isMultipleImages) {
        console.log('WARNING: Multiple images with non-square aspect ratios are not supported')
        console.log('Falling back to 1 image with 1:1 aspect ratio')
        // This will be handled in the response processing
      }
      
      // For multiple images, generate them individually in the background
      if (isMultipleImages) {
        console.log(`Generating ${maxImages} images individually using 1:1 aspect ratio`)
        
        const imagePromises = []
        for (let i = 0; i < (maxImages || 1); i++) {
          if (isImageToImage) {
            imagePromises.push(
              generateSingleImageToImage({
                prompt: enhancedPrompt,
                baseImage: baseImage!,
                size: finalResolution,
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
                size: finalResolution,
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
              enable_sync_mode: enableSyncMode !== false
            }
          : {
              prompt: enhancedPrompt,
              size: finalResolution,
              max_images: 1,
              enable_base64_output: enableBase64Output || false,
              enable_sync_mode: enableSyncMode !== false,
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
          throw new Error(`Seedream API error: ${seedreamResponse.status} - ${errorText}`)
        }
        
        const seedreamResponseData = await seedreamResponse.json()
        console.log('Seedream API response data:', seedreamResponseData)
        
        // Handle async response - poll for results
        if (seedreamResponseData.status === 'created' && seedreamResponseData.urls?.get) {
          console.log('Polling for async results...', {
            requestedImages: 1,
            mode: 'async',
            pollUrl: seedreamResponseData.urls.get
          })
          let attempts = 0
          const maxAttempts = 30 // 30 seconds timeout
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
            
            const resultResponse = await fetch(seedreamResponseData.urls.get, {
              headers: {
                'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
              }
            })
            
            if (!resultResponse.ok) {
              throw new Error(`Failed to fetch results: ${resultResponse.status}`)
            }
            
            const resultData = await resultResponse.json()
            console.log(`Polling attempt ${attempts + 1}:`, {
              status: resultData.status,
              outputsCount: resultData.outputs?.length || 0,
              requestedImages: 1,
              hasOutputs: !!resultData.outputs,
              fullResponse: resultData
            })
            
            if (resultData.status === 'succeeded' && resultData.outputs && resultData.outputs.length > 0) {
              console.log(`Async generation succeeded with ${resultData.outputs.length} images (requested: 1)`)
              // Transform the response to match expected format
              seedreamData = {
                code: 200,
                data: {
                  outputs: resultData.outputs.map((output: any) => ({
                    url: output.url || output.image_url || output
                  }))
                }
              }
              break
            } else if (resultData.status === 'failed') {
              console.error('Async generation failed:', resultData.error)
              throw new Error(resultData.error || 'Generation failed')
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
        width: parseInt(finalResolution.split('x')[0] || '1024'),
        height: parseInt(finalResolution.split('x')[1] || '1024'),
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
        custom_style_preset: customStylePreset ? {
          id: customStylePreset.id,
          name: customStylePreset.name,
          style_type: customStylePreset.style_type
        } : null,
        generation_mode: generationMode || 'text-to-image',
        base_image: baseImage || null,
        api_endpoint: isImageToImage ? 'seedream-v4/edit' : 'seedream-v4'
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
    
    if (!isSquareAspectRatio && aspectRatio !== '1:1') {
      warning = `Note: The ${aspectRatio} aspect ratio was automatically converted to 1:1 (square) as it's not supported by the image generation service.`
    } else if ((maxImages || 1) > 1 && seedreamData.data.outputs.length === 1) {
      warning = `Note: Only 1 image was generated instead of ${maxImages} requested. Multiple images are only supported with 1:1 aspect ratio. Credits have been adjusted accordingly.`
    } else if (!isSquareAspectRatio && isMultipleImages) {
      warning = `Note: Multiple images with ${aspectRatio} aspect ratio are not supported. Generated 1 image with 1:1 aspect ratio instead.`
    }
    
    return NextResponse.json({ 
      success: true, 
      project,
      images: seedreamData.data.outputs.map((imgUrl: string) => ({
        url: imgUrl,
        width: parseInt(finalResolution.split('x')[0] || '1024'),
        height: parseInt(finalResolution.split('x')[1] || '1024')
      })),
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
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate images',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
