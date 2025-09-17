import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { 
    prompt, 
    numImages, 
    style, 
    resolution, 
    projectId,
    consistencyLevel
  } = await request.json()
  
  // Parse resolution from frontend (format: "1024*576" or "1024")
  let finalResolution: string
  if (resolution && resolution.includes('*')) {
    // Resolution is in format "1024*576" - use it directly
    finalResolution = resolution
  } else {
    // Resolution is a single number - create square dimensions
    const baseResolution = parseInt(resolution || '1024')
    finalResolution = `${baseResolution}*${baseResolution}`
  }
  
  console.log(`Sequential API using resolution: ${finalResolution}`)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  try {
    // Check user credits (more credits for sequential generation)
    const creditsNeeded = numImages * 3 // 3 credits per image for sequential
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${numImages} sequential images.` },
        { status: 403 }
      )
    }
    
    // Build enhanced prompt for sequential generation
    const enhancedPrompt = `${prompt}. Generate ${numImages || 4} sequential images with consistent characters and objects.`
    
    // Call Seedream Sequential API
    const sequentialResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/sequential', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        max_images: numImages || 4,
        size: finalResolution,
        enable_base64_output: false,
        enable_sync_mode: true
      })
    })
    
    if (!sequentialResponse.ok) {
      throw new Error('Seedream Sequential API error')
    }
    
    const sequentialData = await sequentialResponse.json()
    
    // Check if generation was successful
    if (sequentialData.code !== 200 || !sequentialData.data.outputs || sequentialData.data.outputs.length === 0) {
      throw new Error(sequentialData.message || 'Failed to generate sequential images')
    }
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    // Save or update project
    const projectData = {
      user_id: user.id,
      title: `Sequential: ${prompt.substring(0, 50)}`,
      prompt,
      style,
      aspect_ratio: '1:1',
      resolution,
      generated_images: sequentialData.data.outputs.map((imgUrl: string, index: number) => ({
        url: imgUrl,
        width: parseInt(resolution?.split('*')[0] || '1024'),
        height: parseInt(resolution?.split('*')[1] || '1024'),
        generated_at: new Date().toISOString(),
        sequence_index: index
      })),
      credits_used: creditsNeeded,
      status: 'generated',
      last_generated_at: new Date().toISOString(),
      generation_type: 'sequential'
    }
    
    let project
    if (projectId) {
      const { data, error } = await supabase
        .from('playground_projects')
        .update(projectData)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      project = data
    } else {
      const { data, error } = await supabase
        .from('playground_projects')
        .insert(projectData)
        .select()
        .single()
      
      if (error) throw error
      project = data
    }
    
    return NextResponse.json({ 
      success: true, 
      project,
      images: sequentialData.data.outputs.map((imgUrl: string, index: number) => ({
        url: imgUrl,
        width: parseInt(resolution?.split('*')[0] || '1024'),
        height: parseInt(resolution?.split('*')[1] || '1024'),
        sequence_index: index
      })),
      creditsUsed: creditsNeeded
    })
  } catch (error) {
    console.error('Failed to generate sequential images:', error)
    return NextResponse.json({ error: 'Failed to generate sequential images' }, { status: 500 })
  }
}
