import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { imageUrls, context } = await request.json()
    
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Image URLs are required' },
        { status: 400 }
      )
    }
    
    // Prepare image content for GPT-4 Vision
    const imageContent = imageUrls.slice(0, 3).map((url: string) => ({
      type: 'image_url',
      image_url: {
        url,
        detail: 'low'
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
            content: `You are a professional color analyst and fashion expert specializing in ${context || 'creative moodboards'}. Analyze multiple images together to extract a cohesive color palette that represents the overall aesthetic and mood.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze these ${imageUrls.length} images as a cohesive moodboard and extract a unified color palette. Consider:
                - The dominant colors across all images
                - The overall aesthetic theme
                - Fashion and design trends if applicable
                - Color harmony and relationships
                
                Please provide:
                1. A unified palette of 5-7 hex color codes that best represent the entire collection
                2. A description of how these colors work together
                3. The overall mood and aesthetic
                4. 2-3 additional colors that would complement this palette
                
                Return the response in JSON format:
                {
                  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
                  "description": "Description of the unified color scheme",
                  "mood": "Overall mood (e.g., 'Elegant and Modern')",
                  "suggestions": ["#hex6", "#hex7", "#hex8"],
                  "theme": "Identified theme (e.g., 'Urban Fashion', 'Natural Beauty')"
                }`
              },
              ...imageContent
            ]
          }
        ],
        max_tokens: 600,
        temperature: 0.3
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error('Failed to analyze images')
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No response from AI')
    }
    
    try {
      // Parse the JSON response
      const analysis = JSON.parse(content)
      
      // Ensure we have at least 5 colors
      if (analysis.palette && analysis.palette.length < 5) {
        // Add complementary colors if needed
        while (analysis.palette.length < 5 && analysis.suggestions.length > 0) {
          analysis.palette.push(analysis.suggestions.shift())
        }
      }
      
      return NextResponse.json({
        ...analysis,
        imageCount: imageUrls.length,
        analysisType: 'batch'
      })
    } catch (parseError) {
      // Fallback parsing
      const hexRegex = /#[0-9A-Fa-f]{6}/g
      const colors = content.match(hexRegex) || []
      
      return NextResponse.json({
        palette: colors.slice(0, 5).length > 0 ? colors.slice(0, 5) : ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        description: 'AI-analyzed unified palette from multiple images',
        mood: 'Cohesive',
        suggestions: colors.slice(5, 8),
        theme: context || 'Creative',
        imageCount: imageUrls.length,
        analysisType: 'batch-fallback'
      })
    }
  } catch (error: any) {
    console.error('AI batch palette extraction error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract palette',
        palette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        description: 'Fallback palette',
        mood: 'Default',
        suggestions: [],
        theme: 'Creative',
        imageCount: 0,
        analysisType: 'error-fallback'
      },
      { status: 500 }
    )
  }
}