import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to calculate dimensions based on aspect ratio and resolution
function calculateDimensions(aspectRatio: string, resolution: string) {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
  const aspectRatioValue = widthRatio / heightRatio

  let width: number, height: number

  if (resolution === '720p') {
    if (aspectRatioValue >= 1) {
      width = 1280
      height = Math.round(1280 / aspectRatioValue)
    } else {
      height = 720
      width = Math.round(720 * aspectRatioValue)
    }
  } else {
    if (aspectRatioValue >= 1) {
      width = 854
      height = Math.round(854 / aspectRatioValue)
    } else {
      height = 480
      width = Math.round(480 * aspectRatioValue)
    }
  }

  return { width, height }
}

// Function to apply style using WaveSpeed API
async function applyStyleToImage(
  imageUrl: string,
  stylePrompt: string,
  aspectRatio: string,
  resolution: string
): Promise<string> {
  const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY
  const dimensions = calculateDimensions(aspectRatio, resolution)

  console.log('🎨 Applying style to image...')
  console.log('📝 Style prompt:', stylePrompt)
  console.log('📐 Dimensions:', dimensions)

  const response = await fetch('https://api.wavespeed.io/v1/generations/image-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WAVESPEED_API_KEY}`
    },
    body: JSON.stringify({
      model: 'flux-pro-1.1-ultra',
      prompt: stylePrompt,
      image_url: imageUrl,
      width: dimensions.width,
      height: dimensions.height,
      output_format: 'png',
      safety_tolerance: 2
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ WaveSpeed image-to-image error:', errorText)
    throw new Error(`WaveSpeed API error: ${response.status}`)
  }

  const result = await response.json()
  const generationId = result.id

  console.log('⏳ Polling for styled image completion...')

  // Poll for completion
  let attempts = 0
  const maxAttempts = 60

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const statusResponse = await fetch(`https://api.wavespeed.io/v1/generations/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${WAVESPEED_API_KEY}`
      }
    })

    if (!statusResponse.ok) {
      console.error('❌ Error checking generation status')
      throw new Error('Failed to check generation status')
    }

    const statusResult = await statusResponse.json()

    if (statusResult.status === 'completed' && statusResult.output?.url) {
      console.log('✅ Styled image ready:', statusResult.output.url)
      return statusResult.output.url
    }

    if (statusResult.status === 'failed') {
      console.error('❌ Style application failed:', statusResult.error)
      throw new Error('Style application failed')
    }

    attempts++
  }

  throw new Error('Style application timed out')
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { imageUrl, videoStyle, aspectRatio, resolution, prompt } = requestBody

    console.log('🎨 Apply style request received:', { videoStyle, aspectRatio, resolution })

    if (!imageUrl || !videoStyle || !aspectRatio || !resolution) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user credits
    const { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !userCredits) {
      return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 500 })
    }

    // Style application cost: 10 credits (lower than full video generation)
    const STYLE_APPLICATION_COST = 10

    if (userCredits.current_balance < STYLE_APPLICATION_COST) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: STYLE_APPLICATION_COST, available: userCredits.current_balance },
        { status: 402 }
      )
    }

    // Fetch video style prompt from database
    const { data: styleData, error: styleError } = await supabaseAdmin
      .from('style_prompts')
      .select('image_to_image_prompt')
      .eq('style_name', videoStyle)
      .eq('is_active', true)
      .single()

    if (styleError || !styleData) {
      return NextResponse.json({ error: 'Style not found' }, { status: 404 })
    }

    // Combine style prompt with user prompt
    const stylePrompt = prompt
      ? `${styleData.image_to_image_prompt} ${prompt}`
      : styleData.image_to_image_prompt

    // Apply style to image
    const styledImageUrl = await applyStyleToImage(imageUrl, stylePrompt, aspectRatio, resolution)

    // Deduct credits
    await supabaseAdmin
      .from('user_credits')
      .update({
        current_balance: userCredits.current_balance - STYLE_APPLICATION_COST,
        consumed_this_month: userCredits.current_balance - STYLE_APPLICATION_COST,
        last_consumed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    // Log the transaction
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'style_application',
        credits_used: STYLE_APPLICATION_COST,
        description: `Applied ${videoStyle} style to image`,
        metadata: {
          style: videoStyle,
          aspectRatio,
          resolution,
          originalImageUrl: imageUrl,
          styledImageUrl
        }
      })

    console.log('✅ Style applied successfully, credits deducted:', STYLE_APPLICATION_COST)

    return NextResponse.json({
      success: true,
      styledImageUrl,
      creditsUsed: STYLE_APPLICATION_COST,
      remainingCredits: userCredits.current_balance - STYLE_APPLICATION_COST
    })

  } catch (error: any) {
    console.error('❌ Error in apply-style route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
