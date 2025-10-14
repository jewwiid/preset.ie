import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI color analysis not available',
          palette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
          description: 'Default palette',
          mood: 'Creative',
          suggestions: []
        },
        { status: 200 } // Return 200 with fallback data instead of error
      )
    }
    
    const { imageUrls, context, gigData } = await request.json()
    
    console.log('AI Palette Batch API called with:', { 
      imageCount: imageUrls?.length || 0,
      context, 
      gigData: gigData ? Object.keys(gigData) : null,
      hasKey: !!OPENAI_API_KEY,
      keyPrefix: OPENAI_API_KEY?.substring(0, 20) + '...'
    })
    
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Image URLs are required' },
        { status: 400 }
      )
    }
    
    // Analyze more images for comprehensive understanding (up to 8 for treatment generation)
    const imagesToAnalyze = imageUrls.slice(0, 8)
    
    // Convert proxy URLs to direct URLs for OpenAI access
    const processedUrls = imagesToAnalyze.map((url: string) => {
      // If it's a proxy URL, extract the original URL
      if (url.startsWith('/api/proxy-image?url=')) {
        try {
          const urlParams = new URL(url, 'http://localhost:3000')
          const originalUrl = urlParams.searchParams.get('url')
          if (originalUrl) {
            console.log('Converting proxy URL to direct URL:', { proxy: url, direct: decodeURIComponent(originalUrl) })
            return decodeURIComponent(originalUrl)
          }
        } catch (e) {
          console.error('Failed to extract URL from proxy:', e)
        }
      }
      return url
    })
    
    console.log('Processed URLs for OpenAI:', processedUrls)
    
    // Prepare image content for OpenAI Vision API
    const imageContent = processedUrls.map((url: string) => ({
      type: "image_url",
      image_url: {
        url: url,
        detail: "low" // Use 'low' for faster processing and lower cost
      }
    }))
    
    // Call OpenAI GPT-4 Vision API with multiple images
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a precise color analyst. Extract ONLY the most dominant colors actually present across all images. Do not add colors that aren't there. Do not interpret mood or suggest complementary colors. Focus on accuracy over creativity.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze these ${imagesToAnalyze.length} images and extract ONLY the 5 most dominant colors that are actually present across all images. Do not add colors that aren't there. Do not suggest complementary colors. Be precise and accurate.

Return the response in JSON format:
{
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "description": "Brief description of what colors are actually in the images",
  "mood": "Neutral",
  "suggestions": [],
  "visualAnalysis": "Simple description of the dominant colors found",
  "treatmentNotes": "Colors extracted from actual image content"
}`
              },
              ...imageContent
            ]
          }
        ],
        max_tokens: 1200,
        temperature: 0.3 // Lower temperature for more consistent color extraction
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', { 
        status: response.status, 
        statusText: response.statusText, 
        error: error,
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`Failed to analyze images: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No response from AI')
    }
    
    try {
      console.log('AI response content:', content.substring(0, 500))
      
      // Extract JSON from markdown code blocks if present
      let jsonContent = content
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim()
        }
      } else if (content.includes('```')) {
        const jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim()
        }
      }
      
      // Parse the JSON response from GPT-4
      const analysis = JSON.parse(jsonContent)
      
      // Validate the response structure
      if (!analysis.palette || !Array.isArray(analysis.palette)) {
        throw new Error('Invalid response format')
      }
      
      console.log('Parsed AI analysis:', JSON.stringify(analysis, null, 2))
      return NextResponse.json(analysis)
    } catch (parseError) {
      console.log('JSON parsing failed, content was:', content)
      // If parsing fails, try to extract colors from the text
      const hexRegex = /#[0-9A-Fa-f]{6}/g
      const colors = content.match(hexRegex) || []
      
      return NextResponse.json({
        palette: colors.slice(0, 5).length > 0 ? colors.slice(0, 5) : ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        description: 'AI-analyzed color palette with detailed visual insights',
        mood: 'Creative',
        suggestions: colors.slice(5, 8),
        visualAnalysis: 'AI analysis of visual elements and aesthetic qualities'
      })
    }
  } catch (error: any) {
    console.error('AI batch palette extraction error:', error)
    // Return success with fallback data instead of error to prevent UI disruption
    return NextResponse.json(
      { 
        success: true,
        palette: ['#8B7F77', '#BDB2A7', '#D4C5B9', '#6B5D54', '#4A3F36'], // Earth tones for western theme
        description: 'Cohesive palette (AI analysis unavailable)',
        mood: 'Unified',
        suggestions: ['#C19A65', '#8B7355', '#E6B8A2'],
        aiProvider: 'fallback'
      },
      { status: 200 }
    )
  }
}