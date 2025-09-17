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
    images, // Array of multiple reference images
    editType,
    style,
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
  
  console.log(`Batch Edit API using resolution: ${finalResolution}`)
  
  try {
    // Validate inputs
    if (!prompt || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Prompt and at least one image are required for batch editing.' },
        { status: 400 }
      )
    }

    if (images.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images allowed for batch processing.' },
        { status: 400 }
      )
    }

    // Check user credits (more credits for batch processing)
    const creditsNeeded = images.length * 3 // 3 credits per image for batch editing
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for batch editing ${images.length} images.` },
        { status: 403 }
      )
    }
    
    // Create batch job record
    const { data: batchJob, error: batchJobError } = await supabase
      .from('playground_batch_jobs')
      .insert({
        user_id: user.id,
        project_id: projectId,
        job_type: 'batch_edit',
        total_items: images.length,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (batchJobError) {
      throw new Error('Failed to create batch job')
    }
    
    // Build enhanced prompt for batch editing
    const enhancedPrompt = `${prompt}. Apply ${editType} editing to all images while maintaining consistency across the batch.`
    
    // Process each image individually (since WaveSpeed doesn't support true batch processing yet)
    const results = []
    const errors = []
    let totalCreditsUsed = 0
    
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i]
      
      try {
        // Call Seedream Edit API for each image
        const editResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            images: [imageUrl],
            prompt: enhancedPrompt,
            size: finalResolution,
            enable_base64_output: false,
            enable_sync_mode: true
          })
        })
        
        if (!editResponse.ok) {
          const errorText = await editResponse.text()
          console.error(`API error for image ${i + 1}:`, editResponse.status, errorText)
          
          // Handle platform credit issues gracefully
          if (errorText.includes('Insufficient credits') || errorText.includes('top up')) {
            throw new Error('Image editing service is temporarily unavailable. Please try again in a few minutes.')
          }
          
          throw new Error(`API request failed for image ${i + 1}`)
        }
        
        const editData = await editResponse.json()
        
        if (editData.code === 200 && editData.data.outputs && editData.data.outputs.length > 0) {
          results.push({
            originalImage: imageUrl,
            editedImage: editData.data.outputs[0],
            index: i
          })
          totalCreditsUsed += 3
        } else {
          throw new Error(editData.message || `Failed to edit image ${i + 1}`)
        }
      } catch (error) {
        console.error(`Failed to edit image ${i + 1}:`, error)
        errors.push({
          index: i,
          image: imageUrl,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Update batch job progress
      const progressPercentage = ((i + 1) / images.length) * 100
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
      throw new Error('Failed to edit any images in the batch')
    }
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - totalCreditsUsed,
        consumed_this_month: userCredits.consumed_this_month + totalCreditsUsed
      })
      .eq('user_id', user.id)
    
    // Save batch edit records
    const editRecords = []
    for (const result of results) {
      const { data: editRecord } = await supabase
        .from('playground_image_edits')
        .insert({
          project_id: projectId,
          user_id: user.id,
          edit_type: `batch_${editType}`,
          edit_prompt: enhancedPrompt,
          original_image_url: result.originalImage,
          edited_image_url: result.editedImage,
          credits_used: 3,
          processing_time_ms: Date.now() - new Date().getTime(),
          batch_index: result.index
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
      creditsUsed: totalCreditsUsed,
      processedCount: results.length,
      totalCount: images.length,
      errors: errors
    })
  } catch (error) {
    console.error('Failed to perform batch editing:', error)
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to perform batch editing'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('temporarily unavailable')) {
        userMessage = error.message
        statusCode = 503 // Service Unavailable
      } else if (error.message.includes('API request failed')) {
        userMessage = 'Image editing service is experiencing issues. Please try again later.'
        statusCode = 503
      } else {
        userMessage = error.message
      }
    }
    
    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}
