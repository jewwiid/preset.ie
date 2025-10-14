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
    
    const { imageUrl, context } = await request.json()
    
    console.log('AI Palette API called with:', { 
      imageUrl, 
      context, 
      hasKey: !!OPENAI_API_KEY,
      keyPrefix: OPENAI_API_KEY?.substring(0, 20) + '...'
    })
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      )
    }
    
    // Call OpenAI GPT-4 Vision API
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
            content: `You are a precise color analyst. Extract ONLY the most dominant colors actually present in the image. Do not add colors that aren't there. Do not interpret mood or suggest complementary colors. Focus on accuracy over creativity.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and extract ONLY the 5 most dominant colors that are actually present in the image. Do not add colors that aren't there. Do not suggest complementary colors. Be precise and accurate.

                Return the response in JSON format:
                {
                  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
                  "description": "Brief description of what colors are actually in the image",
                  "mood": "Neutral",
                  "suggestions": []
                }`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low' // Use 'low' for faster processing and lower cost
                }
              }
            ]
          }
        ],
        max_tokens: 500,
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
      throw new Error(`Failed to analyze image: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No response from AI')
    }
    
    try {
      // Parse the JSON response from GPT-4
      const analysis = JSON.parse(content)
      
      // Validate the response structure
      if (!analysis.palette || !Array.isArray(analysis.palette)) {
        throw new Error('Invalid response format')
      }
      
      return NextResponse.json(analysis)
    } catch (parseError) {
      // If parsing fails, try to extract colors from the text
      const hexRegex = /#[0-9A-Fa-f]{6}/g
      const colors = content.match(hexRegex) || []
      
      return NextResponse.json({
        palette: colors.slice(0, 5).length > 0 ? colors.slice(0, 5) : ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        description: 'AI-analyzed color palette',
        mood: 'Creative',
        suggestions: colors.slice(5, 8)
      })
    }
  } catch (error: any) {
    console.error('AI palette extraction error:', error)
    // Return success with fallback data instead of error to prevent UI disruption
    return NextResponse.json(
      { 
        success: true,
        palette: ['#8B7F77', '#BDB2A7', '#D4C5B9', '#6B5D54', '#4A3F36'], // Earth tones for western theme
        description: 'Earth-tone palette (AI analysis unavailable)',
        mood: 'Earthy',
        suggestions: ['#C19A65', '#8B7355', '#E6B8A2'],
        aiProvider: 'fallback'
      },
      { status: 200 }
    )
  }
}