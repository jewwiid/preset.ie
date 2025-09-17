import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  
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
  
  const { 
    prompt, 
    images, 
    numImages, 
    resolution, 
    projectId
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
  
  console.log(`Edit-Sequential API using resolution: ${finalResolution}`)
  
  try {
    // Validate required parameters
    if (!prompt || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Prompt and at least one image are required for sequential editing.' },
        { status: 400 }
      )
    }

    // Check user credits (more credits for sequential editing)
    const creditsNeeded = (numImages || 2) * 4 // 4 credits per image for sequential editing
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${numImages || 2} sequential edited images.` },
        { status: 403 }
      )
    }
    
    // Build enhanced prompt for sequential editing
    const enhancedPrompt = `${prompt}. Generate ${numImages || 2} sequential variations with consistent characters and objects.`
    
    // Call Seedream Edit-Sequential API
    const editSequentialResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit-sequential', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        images: images, // Array of image URLs
        max_images: numImages || 2,
        size: finalResolution,
        enable_base64_output: false,
        enable_sync_mode: true
      })
    })
    
    if (!editSequentialResponse.ok) {
      throw new Error('Seedream Edit-Sequential API error')
    }
    
    const editSequentialData = await editSequentialResponse.json()
    
    // Check if generation was successful
    if (editSequentialData.code !== 200 || !editSequentialData.data.outputs || editSequentialData.data.outputs.length === 0) {
      throw new Error(editSequentialData.message || 'Failed to generate sequential edited images')
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
      title: `Sequential Edit: ${prompt.substring(0, 50)}`,
      prompt: enhancedPrompt,
      style: 'sequential_edit',
      aspect_ratio: '1:1',
      resolution,
      generated_images: editSequentialData.data.outputs.map((imgUrl: string, index: number) => ({
        url: imgUrl,
        width: parseInt(resolution?.split('*')[0] || '2048'),
        height: parseInt(resolution?.split('*')[1] || '2048'),
        generated_at: new Date().toISOString(),
        sequence_index: index,
        source_images: images
      })),
      credits_used: creditsNeeded,
      status: 'generated',
      last_generated_at: new Date().toISOString(),
      generation_type: 'sequential_edit'
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
    
    // Save edit records for each generated image
    const editRecords = []
    for (let i = 0; i < editSequentialData.data.outputs.length; i++) {
      const { data: editRecord } = await supabase
        .from('playground_image_edits')
        .insert({
          project_id: project.id,
          user_id: user.id,
          edit_type: 'sequential_edit',
          edit_prompt: enhancedPrompt,
          original_image_url: images[0], // Use first image as reference
          edited_image_url: editSequentialData.data.outputs[i],
          credits_used: 4, // 4 credits per sequential edit
          processing_time_ms: Date.now() - new Date().getTime()
        })
        .select()
        .single()
      
      if (editRecord) editRecords.push(editRecord)
    }
    
    return NextResponse.json({ 
      success: true, 
      project,
      images: editSequentialData.data.outputs.map((imgUrl: string, index: number) => ({
        url: imgUrl,
        width: parseInt(resolution?.split('*')[0] || '2048'),
        height: parseInt(resolution?.split('*')[1] || '2048'),
        sequence_index: index,
        source_images: images
      })),
      editRecords,
      creditsUsed: creditsNeeded
    })
  } catch (error) {
    console.error('Failed to generate sequential edited images:', error)
    return NextResponse.json({ error: 'Failed to generate sequential edited images' }, { status: 500 })
  }
}
