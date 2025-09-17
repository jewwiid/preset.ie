import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../../lib/auth-utils'
import { createClient } from '@supabase/supabase-js'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Image optimization utility
function optimizeImageForVisionAPI(imageUrl: string): string {
  try {
    const url = new URL(imageUrl)
    
    // Supabase Storage optimization
    if (imageUrl.includes('supabase') || imageUrl.includes('storage')) {
      // Supabase supports transformation parameters
      url.searchParams.set('width', '1024')
      url.searchParams.set('height', '1024')
      url.searchParams.set('quality', '85')
      url.searchParams.set('format', 'webp')
      url.searchParams.set('resize', 'cover') // Maintain aspect ratio
      return url.toString()
    }
    
    // Cloudinary optimization (if used)
    if (imageUrl.includes('cloudinary')) {
      // Cloudinary transformation parameters
      const pathParts = url.pathname.split('/')
      if (pathParts.length >= 3) {
        pathParts.splice(2, 0, 'w_1024,h_1024,c_limit,q_85,f_webp')
        url.pathname = pathParts.join('/')
      }
      return url.toString()
    }
    
    // Vercel Image Optimization (if used)
    if (imageUrl.includes('vercel') || imageUrl.includes('_vercel')) {
      url.searchParams.set('w', '1024')
      url.searchParams.set('h', '1024')
      url.searchParams.set('q', '85')
      url.searchParams.set('f', 'webp')
      return url.toString()
    }
    
    // For other image sources, return original URL
    return imageUrl
    
  } catch (e) {
    console.error('Failed to optimize image URL:', e)
    return imageUrl // Fallback to original
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check subscription tier - only allow Plus and Pro users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (profile.subscription_tier === 'free') {
      return NextResponse.json(
        { 
          error: 'Prompt analysis is only available for Plus and Pro subscribers',
          requiresUpgrade: true,
          currentTier: 'free'
        },
        { status: 403 }
      )
    }

    const { 
      imageUrl, // Optional - for base image analysis
      originalPrompt, 
      style, 
      resolution, 
      aspectRatio, 
      generationMode,
      customStylePreset,
      cinematicParameters, // Cinematic parameters for enhanced analysis
      baseImageUrl, // Alternative field name for base image
      analysisPersona // Persona for specialized analysis
    } = await request.json()

    // Comprehensive input validation
    if (!originalPrompt || originalPrompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'Original prompt is required and must be at least 3 characters long' },
        { status: 400 }
      )
    }

    if (!style || style.trim().length === 0) {
      return NextResponse.json(
        { error: 'Style is required for analysis' },
        { status: 400 }
      )
    }

    if (!resolution || resolution.trim().length === 0) {
      return NextResponse.json(
        { error: 'Resolution is required for analysis' },
        { status: 400 }
      )
    }

    if (!aspectRatio || aspectRatio.trim().length === 0) {
      return NextResponse.json(
        { error: 'Aspect ratio is required for analysis' },
        { status: 400 }
      )
    }

    if (!generationMode || generationMode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Generation mode is required for analysis' },
        { status: 400 }
      )
    }

    // For image-to-image mode, require a base image
    if (generationMode === 'image-to-image' && !imageUrl && !baseImageUrl) {
      return NextResponse.json(
        { error: 'Base image is required for image-to-image generation analysis' },
        { status: 400 }
      )
    }

    // Check prompt length for meaningful analysis
    if (originalPrompt.trim().length < 10) {
      return NextResponse.json(
        { error: 'Prompt is too short for meaningful analysis. Please provide more details (at least 10 characters).' },
        { status: 400 }
      )
    }

    // Check prompt length limit
    if (originalPrompt.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Prompt is too long. Please keep it under 2000 characters for optimal analysis.' },
        { status: 400 }
      )
    }

    // Use either imageUrl or baseImageUrl
    const imageToAnalyze = imageUrl || baseImageUrl
    
    // Debug logging
    console.log('API Debug - Image Analysis:', {
      imageUrl,
      baseImageUrl,
      imageToAnalyze,
      hasImage: !!imageToAnalyze,
      generationMode,
      originalPrompt: originalPrompt.substring(0, 50) + '...'
    })

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Convert proxy URLs to direct URLs for OpenAI access (if image exists)
    let processedUrl = imageToAnalyze
    if (imageToAnalyze && imageToAnalyze.startsWith('/api/proxy-image?url=')) {
      try {
        const urlParams = new URL(imageToAnalyze, 'http://localhost:3000')
        const originalUrl = urlParams.searchParams.get('url')
        if (originalUrl) {
          processedUrl = decodeURIComponent(originalUrl)
        }
      } catch (e) {
        console.error('Failed to extract URL from proxy:', e)
      }
    }

    // Optimize image for OpenAI Vision API
    const optimizedImageUrl = processedUrl ? optimizeImageForVisionAPI(processedUrl) : null
    
    if (optimizedImageUrl && optimizedImageUrl !== processedUrl) {
      console.log('API Debug - Image optimization applied:', {
        originalUrl: processedUrl,
        optimizedUrl: optimizedImageUrl,
        optimization: 'Image resized and compressed for faster processing'
      })
    } else if (optimizedImageUrl) {
      console.log('API Debug - Image optimization:', {
        originalUrl: processedUrl,
        optimizedUrl: optimizedImageUrl,
        optimization: 'No optimization available for this image source'
      })
    }

    // Prepare persona-specific analysis prompt
    const getPersonaPrompt = (persona: any) => {
      if (!persona) {
        return `You are an expert AI image generation prompt engineer.`
      }
      
      return `You are ${persona.name}, ${persona.description}.

Your expertise includes: ${persona.specialization.join(', ')}.
You are analyzing this prompt for: ${persona.targetAudience.join(', ')}.
Your analysis focuses on: ${persona.analysisFocus.join(', ')}.

Apply your professional expertise and industry knowledge to provide specialized analysis.`
    }

    const personaPrompt = getPersonaPrompt(analysisPersona)

    // Prepare the analysis prompt for pre-generation analysis
    const analysisPrompt = `
${personaPrompt}

Analyze the user's input prompt and generation parameters to suggest improvements BEFORE the image is generated.

CONTEXT:
- User's Prompt: "${originalPrompt}"
- Style Applied: ${style}
- Resolution: ${resolution}
- Aspect Ratio: ${aspectRatio}
- Generation Mode: ${generationMode}
${customStylePreset ? `- Custom Style Preset: ${customStylePreset.name} (${customStylePreset.style_type})` : ''}
${cinematicParameters && Object.keys(cinematicParameters).length > 0 ? `- Cinematic Parameters: ${Object.entries(cinematicParameters).filter(([k, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}
${imageToAnalyze ? `- Base Image: User has provided a base image for ${generationMode === 'image-to-image' ? 'image-to-image' : 'reference'} generation` : ''}

ANALYSIS TASK:
1. Analyze the user's prompt from your professional perspective
2. Consider the chosen style, aspect ratio, and generation mode
3. ${cinematicParameters && Object.keys(cinematicParameters).length > 0 ? 'CRITICAL: Analyze how the cinematic parameters enhance or conflict with the base prompt. Consider camera angles, lighting styles, director influences, and other cinematic elements in your analysis.' : ''}
4. ${imageToAnalyze ? 'CRITICAL: If a base image is provided, conduct a comprehensive visual analysis of the image content, composition, lighting, colors, textures, subjects, and details. The improved prompt MUST include extensive description of what you see in the base image, not just mention "base image". Describe specific elements, objects, people, animals, landscapes, architectural features, lighting conditions, color palettes, textures, and compositional elements visible in the image.' : 'For text-to-image generation, ensure the prompt is descriptive enough'}
5. Identify potential issues and improvements specific to your expertise
6. Provide actionable suggestions for better prompt engineering based on your professional experience
7. Consider industry standards and best practices in your field
8. ${imageToAnalyze ? 'IMPORTANT: Generate lengthy, detailed prompts that thoroughly describe the base image content. The prompt should be comprehensive and descriptive, incorporating specific visual elements from the base image into the transformation or enhancement instructions.' : ''}
9. ${cinematicParameters && Object.keys(cinematicParameters).length > 0 ? 'IMPORTANT: Ensure the recommended prompt incorporates the cinematic parameters effectively, creating a cohesive visual narrative that leverages the selected camera techniques, lighting, and stylistic elements.' : ''}

Please provide your analysis in this exact JSON format:
{
  "promptAnalysis": "Professional analysis of the current prompt's strengths and potential issues from your expert perspective",
  "styleAlignment": "How well the prompt aligns with the chosen style and generation mode, considering industry standards",
  "aspectRatioConsiderations": "Specific advice for the chosen aspect ratio (${aspectRatio}) based on your professional experience",
  "cinematicAnalysis": "${cinematicParameters && Object.keys(cinematicParameters).length > 0 ? 'Analysis of how the cinematic parameters (camera angles, lighting, director style, etc.) enhance the visual narrative and prompt effectiveness' : 'N/A - no cinematic parameters provided'}",
  "baseImageInsights": "${imageToAnalyze ? 'Comprehensive analysis of the base image content including specific visual elements, composition, lighting, colors, textures, subjects, and details. Describe what you see in detail and how the prompt should incorporate these elements.' : 'N/A - no base image provided'}",
  "strengths": ["What works well in the current prompt from your professional viewpoint"],
  "weaknesses": ["Areas that could be improved based on your expertise"],
  "improvements": [
    "Professional improvement suggestion 1 based on your specialization",
    "Professional improvement suggestion 2 based on your specialization", 
    "Professional improvement suggestion 3 based on your specialization"
  ],
  "alternativePrompts": [
    "Alternative phrasing option 1 optimized for your target audience",
    "Alternative phrasing option 2 optimized for your target audience"
  ],
  "technicalSuggestions": [
    "Professional technical tip for better results with ${style} style",
    "Aspect ratio specific advice for ${aspectRatio} based on industry standards",
    "Generation mode specific tip for ${generationMode} from your professional experience"
  ],
  "professionalInsights": [
    "Industry-specific insight 1 based on your expertise",
    "Professional recommendation 2 based on your specialization",
    "Best practice suggestion 3 from your field"
  ],
  "recommendedPrompt": "${imageToAnalyze ? 'A comprehensive, lengthy prompt that thoroughly describes the base image content and incorporates specific visual elements, composition, lighting, colors, textures, and details into the transformation instructions. The prompt should be detailed and descriptive, not just mention the base image.' : 'The improved prompt combining all professional suggestions and industry best practices'}",
  "confidence": 0.85,
  "estimatedImprovement": "High/Medium/Low - how much better the improved prompt should be based on professional standards"
}

Be specific and actionable in your suggestions. Focus on prompt engineering techniques that will lead to better image generation results.

${imageToAnalyze ? `
CRITICAL REQUIREMENTS FOR BASE IMAGE ANALYSIS:
- Conduct a thorough visual analysis of the base image
- Identify and describe specific visual elements: objects, people, animals, landscapes, architecture, etc.
- Note lighting conditions, shadows, highlights, and overall illumination
- Describe color palettes, tones, and color relationships
- Identify textures, materials, and surface details
- Analyze composition, framing, and visual hierarchy
- The recommended prompt MUST be lengthy and comprehensive
- Include specific details from the base image in the transformation instructions
- Avoid generic phrases like "base image" - be descriptive and specific
- The prompt should read like a detailed visual description that incorporates the base image elements
` : ''}
`

    // Prepare the content array for the API call
    const contentArray: any[] = [
      {
        type: 'text',
        text: analysisPrompt
      }
    ]

    // Add image if available
    if (optimizedImageUrl) {
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: optimizedImageUrl,
          detail: 'low' // Use low detail for faster processing and lower cost
        }
      })
      console.log('API Debug - Adding optimized image to OpenAI call:', {
        originalUrl: processedUrl,
        optimizedUrl: optimizedImageUrl,
        contentArrayLength: contentArray.length,
        detail: 'low'
      })
    } else {
      console.log('API Debug - No image to analyze, text-only analysis')
    }

    // Call OpenAI GPT-4 Vision API (or regular GPT-4 if no image)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: processedUrl ? 'gpt-4o-mini' : 'gpt-4o-mini', // Use same model for consistency
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI image generation prompt engineer with deep knowledge of various AI art models and prompt engineering techniques.'
          },
          {
            role: 'user',
            content: contentArray
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', response.status, errorData)
      return NextResponse.json(
        { error: 'Failed to analyze image with OpenAI' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const analysisText = data.choices?.[0]?.message?.content

    if (!analysisText) {
      return NextResponse.json(
        { error: 'No analysis received from OpenAI' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let analysisResult
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      return NextResponse.json(
        { 
          error: 'Failed to parse analysis result',
          rawResponse: analysisText
        },
        { status: 500 }
      )
    }

    // Store analysis in database for history
    const { error: dbError } = await supabaseAdmin
      .from('playground_prompt_analyses')
      .insert({
        user_id: user.id,
        image_url: imageToAnalyze, // Base image URL if provided
        original_prompt: originalPrompt,
        style_applied: style,
        resolution: resolution,
        aspect_ratio: aspectRatio,
        generation_mode: generationMode,
        analysis_result: analysisResult,
        subscription_tier: profile.subscription_tier
      })

    if (dbError) {
      console.error('Failed to store analysis:', dbError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      metadata: {
        imageUrl: imageToAnalyze, // Base image URL if provided
        originalPrompt: originalPrompt,
        style: style,
        resolution: resolution,
        aspectRatio: aspectRatio,
        generationMode: generationMode,
        subscriptionTier: profile.subscription_tier,
        analysisType: 'pre-generation' // Indicate this is pre-generation analysis
      }
    })

  } catch (error) {
    console.error('Prompt analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
