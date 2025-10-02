import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAI()
    const {
      prompt,
      subject,
      style,
      subjectCategory,
      cinematicParameters,
      generationMode
    } = await request.json()

    if (!prompt && !subject) {
      return NextResponse.json(
        { error: 'Prompt or subject is required' },
        { status: 400 }
      )
    }

    // Build context for AI enhancement
    const context = buildEnhancementContext({
      prompt,
      subject,
      style,
      subjectCategory,
      cinematicParameters,
      generationMode
    })

    // Determine if this is video generation
    const isVideoMode = generationMode === 'image-to-video' || generationMode === 'text-to-video'

    // Call OpenAI to enhance the prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: isVideoMode
            ? `You are an expert AI video prompt engineer. Your job is to enhance video generation prompts to create dynamic, cinematic motion.

Key guidelines:
- For image-to-video: Focus on natural motion, camera movements, and how elements should animate
- For text-to-video: Describe both the scene AND the motion/camera work in detail
- Include specific motion terms: pan, tilt, zoom, dolly, tracking, slow motion, time-lapse
- Describe how subjects should move: gentle, dramatic, smooth, fast-paced, subtle
- Add details about temporal elements: lighting changes, atmospheric effects over time
- Keep the core subject and intent intact
- Don't exceed 200 words
- Return ONLY the enhanced prompt, no explanations or commentary`
            : `You are an expert AI image prompt engineer. Your job is to enhance image generation prompts to be more detailed, vivid, and likely to produce high-quality results.

Key guidelines:
- Add specific visual details about composition, lighting, mood, and atmosphere
- Include technical photography/cinematography terms when appropriate
- Keep the core subject and intent intact
- Make the prompt clear and structured
- Don't exceed 200 words
- Return ONLY the enhanced prompt, no explanations or commentary`
        },
        {
          role: 'user',
          content: context
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const enhancedPrompt = completion.choices[0]?.message?.content?.trim()

    if (!enhancedPrompt) {
      return NextResponse.json(
        { error: 'Failed to enhance prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      enhancedPrompt,
      originalPrompt: prompt,
      tokensUsed: completion.usage?.total_tokens || 0
    })

  } catch (error) {
    console.error('Error enhancing prompt:', error)
    return NextResponse.json(
      { error: 'Failed to enhance prompt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function buildEnhancementContext({
  prompt,
  subject,
  style,
  subjectCategory,
  cinematicParameters,
  generationMode
}: {
  prompt: string
  subject?: string
  style?: string
  subjectCategory?: string
  cinematicParameters?: any
  generationMode?: string
}) {
  let context = `Enhance this ${generationMode || 'image generation'} prompt:\n\n`
  context += `Current prompt: "${prompt}"\n\n`

  if (subject) {
    context += `Subject: ${subject}\n`
  }

  if (subjectCategory) {
    context += `Subject category: ${subjectCategory}\n`
  }

  if (style) {
    context += `Style: ${style}\n`
  }

  if (cinematicParameters && Object.keys(cinematicParameters).length > 0) {
    context += `\nCinematic parameters:\n`

    if (cinematicParameters.cameraAngle) context += `- Camera angle: ${cinematicParameters.cameraAngle}\n`
    if (cinematicParameters.lensType) context += `- Lens: ${cinematicParameters.lensType}\n`
    if (cinematicParameters.shotSize) context += `- Shot size: ${cinematicParameters.shotSize}\n`
    if (cinematicParameters.lightingStyle) context += `- Lighting: ${cinematicParameters.lightingStyle}\n`
    if (cinematicParameters.sceneMood) context += `- Mood: ${cinematicParameters.sceneMood}\n`
    if (cinematicParameters.colorPalette) context += `- Color palette: ${cinematicParameters.colorPalette}\n`
    if (cinematicParameters.depthOfField) context += `- Depth of field: ${cinematicParameters.depthOfField}\n`
    if (cinematicParameters.compositionTechnique) context += `- Composition: ${cinematicParameters.compositionTechnique}\n`
  }

  context += `\nProvide an enhanced, detailed prompt that maintains the original intent while adding vivid visual details.`

  return context
}
