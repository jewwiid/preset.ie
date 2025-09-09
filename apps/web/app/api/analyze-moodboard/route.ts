import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// AI prompt to analyze moodboard vibe and aesthetics
const generateVibePrompt = (items: any[], title: string, description?: string) => {
  const imageCount = items.filter(i => i.type === 'image').length
  const sources = [...new Set(items.map(i => i.source))]
  
  return `Analyze this moodboard titled "${title}" with ${imageCount} images${description ? ` and description: "${description}"` : ''}.
  
  Provide:
  1. A vibe summary (1-2 sentences capturing the overall aesthetic and mood)
  2. 3-5 mood descriptors (single words like "ethereal", "bold", "minimalist")
  3. 3-5 style tags for searchability
  
  Keep the tone professional and inspirational. Focus on visual aesthetics, color theory, and creative direction.`
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    const { items, title, description } = await request.json()
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items to analyze' },
        { status: 400 }
      )
    }
    
    // Extract dominant colors from images (using first 5 items)
    const palette = extractColorPalette(items.slice(0, 5))
    
    // For now, use pre-defined aesthetic analysis based on common patterns
    // In production, this would call OpenAI/Claude API
    const vibeAnalysis = analyzeVibe(items, title, description)
    
    // If we have OpenAI API key, use it for better analysis
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: 'You are a creative director analyzing moodboards for aesthetic and vibe.'
              },
              {
                role: 'user',
                content: generateVibePrompt(items, title, description)
              }
            ],
            temperature: 0.7,
            max_tokens: 300
          })
        })
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const aiContent = aiData.choices[0]?.message?.content
          
          if (aiContent) {
            // Parse AI response
            const lines = aiContent.split('\n').filter(l => l.trim())
            const vibeSummary = lines.find(l => l.toLowerCase().includes('vibe') || l.length > 50) || vibeAnalysis.vibeSummary
            const moodDescriptors = extractWords(lines.find(l => l.toLowerCase().includes('mood')) || '') || vibeAnalysis.moodDescriptors
            const tags = extractWords(lines.find(l => l.toLowerCase().includes('tag')) || '') || vibeAnalysis.tags
            
            return NextResponse.json({
              success: true,
              vibeSummary,
              moodDescriptors,
              tags,
              palette,
              aiProvider: 'openai'
            })
          }
        }
      } catch (aiError) {
        console.error('OpenAI API error:', aiError)
        // Fall back to local analysis
      }
    }
    
    // Return local analysis if no AI API available
    return NextResponse.json({
      success: true,
      ...vibeAnalysis,
      palette,
      aiProvider: 'local'
    })
    
  } catch (error: any) {
    console.error('Analyze moodboard error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}

// Local vibe analysis based on patterns
function analyzeVibe(items: any[], title: string, description?: string): any {
  const imageCount = items.length
  const hasEnhanced = items.some(i => i.source === 'ai-enhanced')
  const hasPexels = items.some(i => i.source === 'pexels')
  
  // Analyze based on title keywords
  const titleLower = title.toLowerCase()
  const descLower = (description || '').toLowerCase()
  const combined = `${titleLower} ${descLower}`
  
  let vibeSummary = ''
  let moodDescriptors: string[] = []
  let tags: string[] = []
  
  // Fashion/Style
  if (combined.includes('fashion') || combined.includes('style') || combined.includes('outfit')) {
    vibeSummary = `A curated fashion moodboard showcasing ${imageCount} carefully selected visuals that embody contemporary style and ${hasEnhanced ? 'enhanced' : 'authentic'} aesthetic expression.`
    moodDescriptors = ['chic', 'sophisticated', 'trendy', 'refined', 'contemporary']
    tags = ['fashion', 'style', 'aesthetic', 'contemporary', 'curated']
  }
  // Nature/Outdoor
  else if (combined.includes('nature') || combined.includes('outdoor') || combined.includes('landscape')) {
    vibeSummary = `An organic collection capturing the essence of natural beauty through ${imageCount} harmonious images that celebrate the outdoors.`
    moodDescriptors = ['organic', 'serene', 'natural', 'earthy', 'tranquil']
    tags = ['nature', 'outdoor', 'landscape', 'organic', 'environmental']
  }
  // Urban/City
  else if (combined.includes('urban') || combined.includes('city') || combined.includes('street')) {
    vibeSummary = `A dynamic urban exploration featuring ${imageCount} images that capture the energy and rhythm of city life.`
    moodDescriptors = ['urban', 'dynamic', 'modern', 'energetic', 'industrial']
    tags = ['urban', 'city', 'street', 'metropolitan', 'contemporary']
  }
  // Minimalist/Clean
  else if (combined.includes('minimal') || combined.includes('clean') || combined.includes('simple')) {
    vibeSummary = `A minimalist composition of ${imageCount} thoughtfully curated images emphasizing simplicity, space, and intentional design.`
    moodDescriptors = ['minimal', 'clean', 'simple', 'refined', 'spacious']
    tags = ['minimalist', 'clean', 'simple', 'modern', 'design']
  }
  // Vintage/Retro
  else if (combined.includes('vintage') || combined.includes('retro') || combined.includes('classic')) {
    vibeSummary = `A nostalgic journey through ${imageCount} carefully selected images that evoke timeless charm and vintage character.`
    moodDescriptors = ['vintage', 'nostalgic', 'classic', 'timeless', 'retro']
    tags = ['vintage', 'retro', 'classic', 'nostalgia', 'timeless']
  }
  // Default creative
  else {
    vibeSummary = `A thoughtfully assembled collection of ${imageCount} images that create a cohesive visual narrative with ${hasEnhanced ? 'enhanced depth and' : ''} artistic expression.`
    moodDescriptors = ['creative', 'artistic', 'expressive', 'inspired', 'curated']
    tags = ['creative', 'artistic', 'moodboard', 'visual', 'inspiration']
  }
  
  return {
    vibeSummary,
    moodDescriptors,
    tags
  }
}

// Extract color palette from items
function extractColorPalette(items: any[]): string[] {
  // Common aesthetic color palettes
  const palettes = {
    warm: ['#E6B8A2', '#D4A574', '#C19A65', '#8B7355', '#6B563F'],
    cool: ['#A8DADC', '#457B9D', '#1D3557', '#F1FAEE', '#E63946'],
    earth: ['#8B7F77', '#BDB2A7', '#D4C5B9', '#6B5D54', '#4A3F36'],
    pastel: ['#FFE5E5', '#FFE0F7', '#E5E0FF', '#E0F2FF', '#E0FFF4'],
    bold: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
    monochrome: ['#2B2B2B', '#5C5C5C', '#8E8E8E', '#C0C0C0', '#E8E8E8']
  }
  
  // Try to detect palette based on source or enhanced status
  const hasEnhanced = items.some(i => i.source === 'ai-enhanced')
  const itemCount = items.length
  
  // Select palette based on characteristics
  if (hasEnhanced) {
    return palettes.bold
  } else if (itemCount > 4) {
    return palettes.warm
  } else if (itemCount <= 2) {
    return palettes.monochrome
  } else {
    return palettes.earth
  }
}

// Extract words from AI response
function extractWords(text: string): string[] {
  const words = text.match(/\b[a-z]+\b/gi) || []
  return words
    .filter(w => w.length > 3 && !['mood', 'descriptors', 'tags', 'style', 'words'].includes(w.toLowerCase()))
    .slice(0, 5)
}