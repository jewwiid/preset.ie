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
      
      // Check if this is a playground project task (find by taskId in metadata)
      const { data: playgroundProjects, error: playgroundError } = await supabaseAdmin
        .from('playground_projects')
        .select('*')
        .contains('metadata', { taskId })
      
      if (playgroundProjects && playgroundProjects.length > 0 && !playgroundError) {
        const project = playgroundProjects[0]
        console.log('🎯 Found playground project for taskId:', taskId)
        
        // Add the generated image to the project
        const newImage = {
          url: resultImageUrl,
          width: 1024, // Default dimensions
          height: 1024,
          generated_at: new Date().toISOString(),
          provider: 'nanobanana'
        }
        
        const updatedImages = [...(project.generated_images || []), newImage]
        
        // Update playground project with the result
        const { error: updatePlaygroundError } = await supabaseAdmin
          .from('playground_projects')
          .update({
            generated_images: updatedImages,
            status: 'generated', // Change from 'processing' to 'generated'
            last_generated_at: new Date().toISOString()
          })
          .eq('id', project.id)
        
        if (updatePlaygroundError) {
          console.error('Error updating playground project:', updatePlaygroundError)
        } else {
          console.log('✅ Playground project updated successfully with new image')
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
      
      // Check if this is a playground project task (find by taskId in metadata)
      const { data: playgroundProjects, error: playgroundError } = await supabaseAdmin
        .from('playground_projects')
        .select('*')
        .contains('metadata', { taskId })
      
      if (playgroundProjects && playgroundProjects.length > 0 && !playgroundError) {
        const project = playgroundProjects[0]
        console.log('🎯 Found playground project for failed taskId:', taskId)
        
        // Update playground project with error
        const { error: updatePlaygroundError } = await supabaseAdmin
          .from('playground_projects')
          .update({
            status: 'draft', // Reset to draft on failure
            metadata: {
              ...project.metadata,
              error_message: msg || 'Unknown error',
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', project.id)
        
        if (updatePlaygroundError) {
          console.error('Error updating failed playground project:', updatePlaygroundError)
        } else {
          console.log('✅ Playground project updated with error status')
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