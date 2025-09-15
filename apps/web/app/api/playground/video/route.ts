import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { 
    imageUrl, 
    duration, 
    resolution, 
    motionType,
    projectId
  } = await request.json()

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
    // Check user credits for video generation (expensive)
    const creditsNeeded = resolution === '720p' ? 10 : 8 // 8 credits for 480p, 10 for 720p
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for video generation.` },
        { status: 403 }
      )
    }
    
    // Determine API endpoint based on resolution
    const apiEndpoint = resolution === '720p' 
      ? 'https://api.wavespeed.ai/api/v3/bytedance/seedance-v1-pro-i2v-720p'
      : 'https://api.wavespeed.ai/api/v3/bytedance/seedance-v1-pro-i2v-480p'
    
    // Call Seedance Video API
    const videoResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        duration: duration || 3, // Default 3 seconds
        motion_type: motionType || 'subtle',
        enable_base64_output: false,
        enable_sync_mode: true
      })
    })
    
    if (!videoResponse.ok) {
      throw new Error('Seedance Video API error')
    }
    
    const videoData = await videoResponse.json()
    
    // Check if generation was successful
    if (videoData.code !== 200 || !videoData.data.outputs || videoData.data.outputs.length === 0) {
      throw new Error(videoData.message || 'Failed to generate video')
    }
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    // Save video record
    const { data: videoRecord } = await supabase
      .from('playground_image_edits')
      .insert({
        project_id: projectId,
        user_id: user.id,
        edit_type: 'video_generation',
        edit_prompt: `Generate ${duration}s video from image`,
        original_image_url: imageUrl,
        edited_image_url: videoData.data.outputs[0], // Video URL
        strength: 1.0,
        credits_used: creditsNeeded,
        processing_time_ms: Date.now() - new Date().getTime(),
        metadata: {
          duration,
          resolution,
          motion_type: motionType,
          video_url: videoData.data.outputs[0]
        }
      })
      .select()
      .single()
    
    return NextResponse.json({ 
      success: true, 
      videoRecord,
      videoUrl: videoData.data.outputs[0],
      duration,
      resolution,
      creditsUsed: creditsNeeded
    })
  } catch (error) {
    console.error('Failed to generate video:', error)
    return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 })
  }
}
