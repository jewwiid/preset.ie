import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get OpenAI API key fresh each time to avoid caching issues
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    console.log('🔑 OpenAI API Key check:', {
      hasKey: !!OPENAI_API_KEY,
      keyLength: OPENAI_API_KEY?.length || 0,
      keyPrefix: OPENAI_API_KEY?.substring(0, 20) + '...',
      keyType: OPENAI_API_KEY?.startsWith('sk-svcacct') ? 'service-account' : OPENAI_API_KEY?.startsWith('sk-proj') ? 'project' : OPENAI_API_KEY?.startsWith('sk-') ? 'legacy' : 'unknown'
    })
    
    // Check if API key is configured (same pattern as working AI palette API)
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI image analysis not available',
          description: 'A beautiful AI-generated image with artistic composition and natural lighting.'
        },
        { status: 200 } // Return 200 with fallback data instead of error
      )
    }
    
    const { imageUrl, generationMetadata } = await request.json()
    
    console.log('AI Image Analysis API called with:', { 
      imageUrl,
      imageUrlType: typeof imageUrl,
      imageUrlLength: imageUrl?.length,
      isValidUrl: imageUrl?.startsWith('http'),
      hasMetadata: !!generationMetadata,
      hasKey: !!OPENAI_API_KEY,
      keyPrefix: OPENAI_API_KEY?.substring(0, 20) + '...'
    })
    
    // Convert proxy URLs to direct URLs for OpenAI access (same as ai-palette-batch)
    let processedImageUrl = imageUrl
    if (imageUrl?.startsWith('/api/proxy-image?url=')) {
      try {
        const urlParams = new URL(imageUrl, 'http://localhost:3000')
        const originalUrl = urlParams.searchParams.get('url')
        if (originalUrl) {
          processedImageUrl = decodeURIComponent(originalUrl)
          console.log('Converting proxy URL to direct URL:', { proxy: imageUrl, direct: processedImageUrl })
        }
      } catch (e) {
        console.error('Failed to extract URL from proxy:', e)
      }
    }
    
    console.log('Final image URL for OpenAI:', processedImageUrl)
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Build context from generation metadata
    let contextPrompt = "Analyze this AI-generated image and provide a detailed, professional description."
    
    if (generationMetadata) {
      const context = []
      
      if (generationMetadata.generation_mode === 'image-to-image') {
        context.push("This is an AI-edited image based on a source photograph")
      } else {
        context.push("This is an AI-generated image created from text")
      }
      
      if (generationMetadata.style) {
        context.push(`Style: ${generationMetadata.style}`)
      }
      
      if (generationMetadata.cinematic_parameters) {
        const params = generationMetadata.cinematic_parameters
        const cinematicDetails = []
        if (params.lensType) cinematicDetails.push(`lens: ${params.lensType}`)
        if (params.shotSize) cinematicDetails.push(`shot: ${params.shotSize}`)
        if (params.timeSetting) cinematicDetails.push(`time: ${params.timeSetting}`)
        if (params.locationType) cinematicDetails.push(`location: ${params.locationType}`)
        if (params.directorStyle) cinematicDetails.push(`style: ${params.directorStyle}`)
        
        if (cinematicDetails.length > 0) {
          context.push(`Cinematic parameters: ${cinematicDetails.join(', ')}`)
        }
      }
      
      if (generationMetadata.provider) {
        context.push(`Generated using: ${generationMetadata.provider}`)
      }
      
      contextPrompt = `Analyze this AI-generated image. Context: ${context.join('. ')}. Provide a detailed, professional description that captures the visual elements, composition, lighting, mood, and artistic qualities of the image.`
    }
    
    // Build request body
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
               {
                 role: 'system',
                 content: `You are a professional art critic. Provide concise, engaging image descriptions in 2-3 sentences. Focus on mood, composition, and visual story. Write in a professional but accessible tone suitable for gallery descriptions.`
               },
        {
          role: 'user',
          content: [
                   {
                     type: 'text',
                     text: `${contextPrompt}

Write a concise, engaging description in 2-3 sentences that captures the essence of the image. Focus on the mood, composition, and visual story without being overly technical or verbose. Make it suitable for a gallery or portfolio description.`
                   },
              {
                type: 'image_url',
                image_url: {
                  url: processedImageUrl,
                  detail: 'low' // Use 'low' for faster processing and lower cost (same as working API)
                }
              }
          ]
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    }

    console.log('🤖 OpenAI request details:', {
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      hasImageUrl: !!imageUrl,
      imageUrlValid: imageUrl?.startsWith('http'),
      maxTokens: requestBody.max_tokens,
      temperature: requestBody.temperature
    })
    
    // Call OpenAI GPT-4 Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', { 
        status: response.status, 
        statusText: response.statusText, 
        error: error,
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`Failed to analyze image: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const description = data.choices?.[0]?.message?.content || 'A beautiful AI-generated image with artistic composition and natural lighting.'
    
    console.log('AI analysis completed:', { 
      descriptionLength: description.length
    })
    
    return NextResponse.json({
      success: true,
      description: description.trim()
    })
    
  } catch (error) {
    console.error('AI image analysis error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      description: 'A beautiful AI-generated image with artistic composition and natural lighting.'
    }, { status: 200 }) // Return fallback description instead of error
  }
}
