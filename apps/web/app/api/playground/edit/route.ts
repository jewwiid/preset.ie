import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { projectId, imageUrl, editType, editPrompt, strength, resolution } = await request.json()
  
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
  
  console.log(`Edit API using resolution: ${finalResolution}`)
  
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
    // Check credits for editing
    const creditsNeeded = editType === 'upscale' ? 1 : 2
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${editType}.` },
        { status: 403 }
      )
    }
    
    // Call Seedream API for image editing
    const editResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        images: [imageUrl],
        prompt: editPrompt,
        size: finalResolution,
        enable_base64_output: false,
        enable_sync_mode: true
      })
    })
    
    if (!editResponse.ok) {
      const errorText = await editResponse.text()
      console.error('Edit API error:', editResponse.status, errorText)
      
      // Handle platform credit issues gracefully
      if (errorText.includes('Insufficient credits') || errorText.includes('top up')) {
        throw new Error('Image editing service is temporarily unavailable. Please try again in a few minutes.')
      }
      
      throw new Error('Seedream edit API error')
    }
    
    const editData = await editResponse.json()
    
    // Check if edit was successful
    if (editData.code !== 200 || !editData.data.outputs || editData.data.outputs.length === 0) {
      throw new Error(editData.message || 'Failed to edit image')
    }
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    // Save edit record
    const { data: editRecord } = await supabase
      .from('playground_image_edits')
      .insert({
        project_id: projectId,
        user_id: user.id,
        edit_type: editType,
        edit_prompt: editPrompt,
        original_image_url: imageUrl,
        edited_image_url: editData.data.outputs[0],
        strength,
        credits_used: creditsNeeded
      })
      .select()
      .single()
    
    return NextResponse.json({ 
      success: true, 
      editRecord,
      editedImage: editData.data.outputs[0] 
    })
  } catch (error) {
    console.error('Failed to edit image:', error)
    return NextResponse.json({ error: 'Failed to edit image' }, { status: 500 })
  }
}
