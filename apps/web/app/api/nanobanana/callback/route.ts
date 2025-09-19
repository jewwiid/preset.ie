import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 NanoBanana callback received')
    
    const callbackData = await request.json()
    console.log('Callback data:', callbackData)
    
    const { code, msg, data } = callbackData
    
    if (!data?.taskId) {
      console.error('Missing taskId in callback data')
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }
    
    const taskId = data.taskId
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    if (code === 200) {
      // Success - image generated
      const resultImageUrl = data.info?.resultImageUrl
      
      if (!resultImageUrl) {
        console.error('Missing resultImageUrl in successful callback')
        return NextResponse.json({ error: 'Missing resultImageUrl' }, { status: 400 })
      }
      
      console.log('✅ NanoBanana task completed successfully:', {
        taskId,
        resultImageUrl
      })
      
      // Update the task status in database
      const { error: updateError } = await supabaseAdmin
        .from('enhancement_tasks')
        .update({
          status: 'completed',
          result_image_url: resultImageUrl,
          completed_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', taskId)
      
      if (updateError) {
        console.error('Error updating task status:', updateError)
      } else {
        console.log('Task status updated successfully')
      }
      
      // Also check if this is a playground generation task
      const { data: playgroundTask, error: playgroundError } = await supabaseAdmin
        .from('playground_generations')
        .select('*')
        .eq('id', taskId)
        .single()
      
      if (playgroundTask && !playgroundError) {
        // Update playground generation with the result
        const { error: updatePlaygroundError } = await supabaseAdmin
          .from('playground_generations')
          .update({
            generated_images: [{
              url: resultImageUrl,
              index: 1,
              provider: 'nanobanana'
            }],
            status: 'completed'
          })
          .eq('id', taskId)
        
        if (updatePlaygroundError) {
          console.error('Error updating playground generation:', updatePlaygroundError)
        } else {
          console.log('Playground generation updated successfully')
        }
      }
      
    } else {
      // Error - task failed
      console.error('❌ NanoBanana task failed:', {
        taskId,
        code,
        msg
      })
      
      // Update task status to failed
      const { error: updateError } = await supabaseAdmin
        .from('enhancement_tasks')
        .update({
          status: 'failed',
          error_message: msg || 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
      
      if (updateError) {
        console.error('Error updating failed task status:', updateError)
      }
      
      // Also check if this is a playground generation task
      const { data: playgroundTask, error: playgroundError } = await supabaseAdmin
        .from('playground_generations')
        .select('*')
        .eq('id', taskId)
        .single()
      
      if (playgroundTask && !playgroundError) {
        // Update playground generation with error
        const { error: updatePlaygroundError } = await supabaseAdmin
          .from('playground_generations')
          .update({
            status: 'failed',
            error_message: msg || 'Unknown error'
          })
          .eq('id', taskId)
        
        if (updatePlaygroundError) {
          console.error('Error updating failed playground generation:', updatePlaygroundError)
        }
      }
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ 
      status: 'received',
      taskId,
      processed: true
    })
    
  } catch (error) {
    console.error('Error processing NanoBanana callback:', error)
    return NextResponse.json(
      { 
        error: 'Callback processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'NanoBanana callback endpoint is active',
    timestamp: new Date().toISOString()
  })
}