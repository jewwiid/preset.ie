import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { 
    imageUrl, 
    styles, // Array of style names
    projectId,
    resolution
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
  
  console.log(`Style Variations API using resolution: ${finalResolution}`)

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
    // Validate inputs
    if (!imageUrl || !styles || styles.length === 0) {
      return NextResponse.json(
        { error: 'Image URL and at least one style are required.' },
        { status: 400 }
      )
    }

    if (styles.length > 6) {
      return NextResponse.json(
        { error: 'Maximum 6 style variations allowed.' },
        { status: 400 }
      )
    }

    // Check user credits
    const creditsNeeded = styles.length * 2 // 2 credits per style variation
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${styles.length} style variations.` },
        { status: 403 }
      )
    }
    
    // Create batch job record
    const { data: batchJob, error: batchJobError } = await supabase
      .from('playground_batch_jobs')
      .insert({
        user_id: user.id,
        project_id: projectId,
        job_type: 'style_variations',
        total_items: styles.length,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (batchJobError) {
      throw new Error('Failed to create batch job')
    }
    
    // Process each style variation
    const results = []
    const errors = []
    
    for (let i = 0; i < styles.length; i++) {
      const style = styles[i]
      
      try {
        // Build style-specific prompt
        const stylePrompts = {
          'photorealistic': 'Transform this image into a photorealistic style with natural lighting and realistic textures',
          'artistic': 'Apply an artistic painting style to this image with bold brushstrokes and vibrant colors',
          'cartoon': 'Convert this image to a cartoon/anime style with simplified features and bright colors',
          'vintage': 'Give this image a vintage film photography look with warm tones and slight grain',
          'cyberpunk': 'Transform this image into a cyberpunk style with neon colors and futuristic elements',
          'watercolor': 'Apply a watercolor painting style with soft edges and translucent colors',
          'sketch': 'Convert this image to a pencil sketch style with fine lines and shading',
          'oil_painting': 'Transform this image into an oil painting style with rich textures and classical composition'
        }
        
        const stylePrompt = stylePrompts[style as keyof typeof stylePrompts] || `Apply ${style} style to this image`
        
        // Call Seedream Edit API for style transfer
        const editResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            images: [imageUrl],
            prompt: stylePrompt,
            size: finalResolution,
            enable_base64_output: false,
            enable_sync_mode: true
          })
        })
        
        if (!editResponse.ok) {
          throw new Error(`API request failed for ${style} style`)
        }
        
        const editData = await editResponse.json()
        
        if (editData.code === 200 && editData.data.outputs && editData.data.outputs.length > 0) {
          results.push({
            style,
            originalImage: imageUrl,
            styledImage: editData.data.outputs[0],
            index: i
          })
        } else {
          throw new Error(editData.message || `Failed to apply ${style} style`)
        }
      } catch (error) {
        console.error(`Failed to apply ${style} style:`, error)
        errors.push({
          index: i,
          style: style,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Update batch job progress
      const progressPercentage = ((i + 1) / styles.length) * 100
      await supabase
        .from('playground_batch_jobs')
        .update({
          processed_items: i + 1,
          failed_items: errors.length,
          progress_percentage: progressPercentage,
          results: results,
          errors: errors
        })
        .eq('id', batchJob.id)
    }
    
    // Update batch job status
    const finalStatus = results.length > 0 ? 'completed' : 'failed'
    await supabase
      .from('playground_batch_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        results: results,
        errors: errors
      })
      .eq('id', batchJob.id)
    
    if (results.length === 0) {
      throw new Error('Failed to generate any style variations')
    }
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    // Save style variation records
    const editRecords = []
    for (const result of results) {
      const { data: editRecord } = await supabase
        .from('playground_image_edits')
        .insert({
          project_id: projectId,
          user_id: user.id,
          edit_type: 'style_variation',
          edit_prompt: `Style: ${result.style}`,
          original_image_url: result.originalImage,
          edited_image_url: result.styledImage,
          credits_used: 2,
          processing_time_ms: Date.now() - new Date().getTime(),
          style_name: result.style
        })
        .select()
        .single()
      
      if (editRecord) editRecords.push(editRecord)
    }
    
    return NextResponse.json({ 
      success: true, 
      batchJobId: batchJob.id,
      results,
      editRecords,
      creditsUsed: creditsNeeded,
      generatedCount: results.length,
      requestedCount: styles.length,
      errors: errors
    })
  } catch (error) {
    console.error('Failed to generate style variations:', error)
    return NextResponse.json({ error: 'Failed to generate style variations' }, { status: 500 })
  }
}
