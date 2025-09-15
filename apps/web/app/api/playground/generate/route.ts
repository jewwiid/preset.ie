import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { prompt, style, aspectRatio, resolution, projectId } = await request.json()
  
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
    // Check user credits
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < 2) {
      return NextResponse.json(
        { error: 'Insufficient credits. Need 2 credits for image generation.' },
        { status: 403 }
      )
    }
    
    // Call Seedream API for image generation
    const seedreamResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        size: resolution || '1024*1024',
        enable_base64_output: false,
        enable_sync_mode: true
      })
    })
    
    if (!seedreamResponse.ok) {
      throw new Error('Seedream API error')
    }
    
    const seedreamData = await seedreamResponse.json()
    
    // Check if generation was successful
    if (seedreamData.code !== 200 || !seedreamData.data.outputs || seedreamData.data.outputs.length === 0) {
      throw new Error(seedreamData.message || 'Failed to generate images')
    }
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - 2,
        consumed_this_month: userCredits.consumed_this_month + 2
      })
      .eq('user_id', user.id)
    
    // Save or update project
    const projectData = {
      user_id: user.id,
      title: prompt.substring(0, 50),
      prompt,
      style,
      aspect_ratio: aspectRatio,
      resolution,
      generated_images: seedreamData.data.outputs.map((imgUrl: string, index: number) => ({
        url: imgUrl,
        width: parseInt(resolution?.split('*')[0] || '1024'),
        height: parseInt(resolution?.split('*')[1] || '1024'),
        generated_at: new Date().toISOString()
      })),
      credits_used: 2,
      status: 'generated',
      last_generated_at: new Date().toISOString()
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
      images: seedreamData.data.outputs.map((imgUrl: string) => ({
        url: imgUrl,
        width: parseInt(resolution?.split('*')[0] || '1024'),
        height: parseInt(resolution?.split('*')[1] || '1024')
      }))
    })
  } catch (error) {
    console.error('Failed to generate images:', error)
    return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 })
  }
}
