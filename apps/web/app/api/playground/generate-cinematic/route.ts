import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'
import { CinematicParameters } from '../../../../../../packages/types/src/cinematic-parameters'
import CinematicPromptBuilder from '../../../../../../packages/services/src/cinematic-prompt-builder'

// Manually load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (from project root)
dotenv.config({ path: path.join(process.cwd(), '../../.env.local') })

// Helper function to generate a single image with cinematic parameters
async function generateSingleCinematicImage({
  prompt,
  baseImage,
  size,
  enableBase64Output,
  enableSyncMode,
  consistencyLevel,
  imageIndex,
  totalImages,
  cinematicParameters,
  enhancedPrompt
}: {
  prompt: string
  baseImage?: string
  size: string
  enableBase64Output: boolean
  enableSyncMode: boolean
  consistencyLevel: string
  imageIndex: number
  totalImages: number
  cinematicParameters?: Partial<CinematicParameters>
  enhancedPrompt?: string
}) {
  console.log(`Generating cinematic image ${imageIndex}/${totalImages}...`)
  console.log('Cinematic parameters:', cinematicParameters)
  console.log('Enhanced prompt:', enhancedPrompt)
  
  const finalPrompt = enhancedPrompt || prompt
  
  try {
    const url = baseImage 
      ? 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit'
      : 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/generate'
    
    const body = baseImage 
      ? {
          prompt: finalPrompt,
          images: [baseImage],
          size,
          enable_base64_output: enableBase64Output,
          enable_sync_mode: enableSyncMode
        }
      : {
          prompt: finalPrompt,
          size,
          enable_base64_output: enableBase64Output,
          enable_sync_mode: enableSyncMode
        }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error for image ${imageIndex}:`, response.status, errorText)
      
      // Handle platform credit issues gracefully
      if (errorText.includes('Insufficient credits') || errorText.includes('top up')) {
        throw new Error('Image generation service is temporarily unavailable. Please try again in a few minutes.')
      }
      
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`Image ${imageIndex} generated successfully`)
    
    return {
      success: true,
      data,
      cinematicMetadata: cinematicParameters ? {
        ...cinematicParameters,
        enhancementPrompt: finalPrompt,
        aiProvider: 'wavespeed-seedream-v4',
        generationCost: 0.025,
        generatedAt: new Date().toISOString()
      } : undefined
    }
  } catch (error) {
    console.error(`Error generating image ${imageIndex}:`, error)
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to generate image'
    if (error instanceof Error) {
      if (error.message.includes('temporarily unavailable')) {
        userMessage = error.message
      } else if (error.message.includes('API error')) {
        userMessage = 'Image generation service is experiencing issues. Please try again later.'
      } else {
        userMessage = error.message
      }
    }
    
    return {
      success: false,
      error: userMessage,
      cinematicMetadata: undefined
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Cinematic generation API called')
    
    // Get user from request
    const { user, error: authError } = await getUserFromRequest(request)
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      prompt,
      style = 'photorealistic',
      resolution = '1024x1024',
      consistencyLevel = 'balanced',
      numImages = 1,
      baseImage,
      generationMode = 'text-to-image',
      intensity = 0.8,
      cinematicParameters,
      enhancedPrompt
    } = body

    console.log('Request body:', {
      prompt: prompt?.substring(0, 100) + '...',
      style,
      resolution,
      consistencyLevel,
      numImages,
      hasBaseImage: !!baseImage,
      generationMode,
      intensity,
      hasCinematicParameters: !!cinematicParameters,
      hasEnhancedPrompt: !!enhancedPrompt
    })

    // Validate required fields
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Check user credits
    const { data: userCredits, error: creditsError } = await supabaseAdmin!
      .from('user_credits')
      .select('current_balance, subscription_tier')
      .eq('user_id', user.id)
      .single()

    if (creditsError) {
      console.error('Error fetching user credits:', creditsError)
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 })
    }

    if (!userCredits || userCredits.current_balance < numImages) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          currentBalance: userCredits?.current_balance || 0,
          requiredCredits: numImages
        },
        { status: 402 }
      )
    }

    // Use cinematic prompt builder if parameters are provided
    let finalPrompt = prompt
    let cinematicMetadata: CinematicParameters | undefined

    if (cinematicParameters && Object.keys(cinematicParameters).length > 0) {
      const promptBuilder = new CinematicPromptBuilder()
      const result = promptBuilder.constructPrompt({
        basePrompt: prompt,
        cinematicParameters,
        enhancementType: generationMode === 'image-to-image' ? 'style' : 'generate',
        includeTechnicalDetails: body.includeTechnicalDetails ?? true,
        includeStyleReferences: body.includeStyleReferences ?? true
      })
      
      finalPrompt = result.fullPrompt
      cinematicMetadata = {
        ...cinematicParameters,
        enhancementPrompt: finalPrompt,
        aiProvider: 'wavespeed-seedream-v4',
        generationCost: 0.025 * numImages,
        generatedAt: new Date().toISOString()
      }
      
      console.log('Cinematic prompt constructed:', {
        original: prompt,
        enhanced: finalPrompt,
        parameters: cinematicParameters
      })
    }

    // Generate images
    const results = []
    const errors = []

    for (let i = 0; i < numImages; i++) {
      const result = await generateSingleCinematicImage({
        prompt: finalPrompt,
        baseImage,
        size: resolution,
        enableBase64Output: true,
        enableSyncMode: false,
        consistencyLevel,
        imageIndex: i + 1,
        totalImages: numImages,
        cinematicParameters,
        enhancedPrompt: finalPrompt
      })

      if (result.success) {
        results.push({
          ...result.data,
          cinematicMetadata: result.cinematicMetadata
        })
      } else {
        errors.push({
          imageIndex: i + 1,
          error: result.error
        })
      }
    }

    // Deduct credits
    if (results.length > 0) {
      const newBalance = userCredits.current_balance - results.length
      const { error: updateError } = await supabaseAdmin!
        .from('user_credits')
        .update({ current_balance: newBalance })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating credits:', updateError)
      }
    }

    // Store results in database with cinematic metadata
    if (results.length > 0 && cinematicMetadata) {
      try {
        const mediaInserts = results.map((result, index) => ({
          owner_user_id: user.id,
          gig_id: null,
          type: 'image' as const,
          bucket: 'generated-images',
          path: `cinematic_${Date.now()}_${index}.jpg`,
          filename: `cinematic_${Date.now()}_${index}.jpg`,
          width: result.width || null,
          height: result.height || null,
          palette: result.palette || null,
          blurhash: result.blurhash || null,
          exif_json: result.exif || null,
          visibility: 'private' as const,
          ai_metadata: cinematicMetadata
        }))

        const { error: insertError } = await supabaseAdmin!
          .from('media')
          .insert(mediaInserts)

        if (insertError) {
          console.error('Error storing cinematic metadata:', insertError)
        }
      } catch (error) {
        console.error('Error storing results:', error)
      }
    }

    return NextResponse.json({
      success: true,
      results: results.map(result => ({
        image: result.image,
        width: result.width,
        height: result.height,
        cinematicMetadata: result.cinematicMetadata
      })),
      errors,
      creditsUsed: results.length,
      newBalance: userCredits.current_balance - results.length,
      cinematicPrompt: finalPrompt !== prompt ? finalPrompt : undefined
    })

  } catch (error) {
    console.error('Cinematic generation error:', error)
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to generate cinematic images'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('temporarily unavailable')) {
        userMessage = error.message
        statusCode = 503 // Service Unavailable
      } else if (error.message.includes('Seedream API error') || error.message.includes('Insufficient credits')) {
        userMessage = 'Image generation service is experiencing issues. Please try again later.'
        statusCode = 503
      } else {
        userMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}
