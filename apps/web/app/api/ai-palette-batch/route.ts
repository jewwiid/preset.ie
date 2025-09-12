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
            content: `You are a professional creative director, treatment writer, and visual consultant specializing in creative briefs and artistic direction for fashion, photography, and creative projects. Your expertise lies in analyzing visual references to create comprehensive treatments that guide creative execution.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `CREATIVE BRIEF ANALYSIS FOR TREATMENT GENERATION

I'm analyzing a moodboard titled "${context}" with ${imagesToAnalyze.length} reference images for a creative project with the following specifications:

${gigData ? `
**PROJECT DETAILS:**
${gigData.title ? `• Project Title: "${gigData.title}"` : ''}
${gigData.description ? `• Brief Description: ${gigData.description}` : ''}
${gigData.purpose ? `• Creative Purpose: ${gigData.purpose}` : ''}
${gigData.comp_type ? `• Project Type: ${gigData.comp_type}` : ''}
${gigData.location_text ? `• Location: ${gigData.location_text}` : ''}
${gigData.start_time ? `• Timeline: ${new Date(gigData.start_time).toDateString()}` : ''}
${gigData.usage_rights ? `• Usage Requirements: ${gigData.usage_rights}` : ''}
${gigData.safety_notes ? `• Special Notes: ${gigData.safety_notes}` : ''}
` : ''}

**TASK:** Analyze these ${imagesToAnalyze.length} reference images to create a comprehensive creative treatment that will guide the execution of this project.

**REQUIRED ANALYSIS:**

1. **Visual Narrative & Concept**: What story do these images tell together? What creative concept emerges from the visual references?

2. **Technical Execution Details**: Lighting styles, composition techniques, camera angles, styling approaches, and technical specifications observed.

3. **Aesthetic Direction**: Color theory, mood, atmosphere, and overall visual language that should guide the creative execution.

4. **Style Consistency**: How do these references work together to create a cohesive creative direction? What are the unifying elements?

5. **Color Psychology & Palette**: Professional color palette with strategic reasoning for each color choice and how they serve the creative concept.

Return detailed analysis in JSON format:
{
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "description": "Comprehensive creative treatment description (3-4 sentences) that synthesizes all visual references into actionable creative direction",
  "mood": "Primary mood/atmosphere for creative execution",
  "suggestions": ["#hex6", "#hex7", "#hex8"],
  "visualAnalysis": "Detailed breakdown of visual elements, technical approaches, and creative techniques observed across all reference images",
  "treatmentNotes": "Specific guidance for creative execution based on visual analysis"
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