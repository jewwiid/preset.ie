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
            content: `You are a professional color analyst and fashion expert. Analyze images and extract meaningful color palettes for ${context || 'creative projects'}. Focus on dominant colors that define the mood and aesthetic.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and extract a color palette. Please provide:
                1. A palette of 5 hex color codes that best represent the image
                2. A brief description of the color scheme
                3. The overall mood conveyed by these colors
                4. 2-3 suggestions for complementary colors
                
                Return the response in JSON format:
                {
                  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
                  "description": "Brief description of the color scheme",
                  "mood": "One or two words describing the mood",
                  "suggestions": ["#hex6", "#hex7", "#hex8"]
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
      console.error('OpenAI API error:', error)
      throw new Error('Failed to analyze image')
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
    return NextResponse.json(
      { 
        error: 'Failed to extract palette',
        palette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        description: 'Fallback palette',
        mood: 'Default',
        suggestions: []
      },
      { status: 500 }
    )
  }
}