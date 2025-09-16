import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '../../../../../lib/auth-utils'

const wavespeedApiKey = process.env.WAVESPEED_API_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Call WaveSpeed API to get task result
    const response = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${taskId}/result`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${wavespeedApiKey}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { success: false, error: `WaveSpeed API error: ${errorData.message || 'Unknown error'}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('WaveSpeed API response:', JSON.stringify(result, null, 2))
    console.log('WaveSpeed API response keys:', Object.keys(result))
    
    // Handle the actual WaveSpeed API response format
    const status = result.data?.status || result.status
    const outputs = result.data?.outputs || result.outputs
    
    console.log('WaveSpeed API status:', status)
    console.log('WaveSpeed API outputs:', outputs)
    
    // Check if task is completed - handle both response formats
    if (status === 'completed' && outputs && outputs.length > 0) {
      const videoUrl = outputs[0]
      console.log('Video generation completed in API:', { 
        videoUrl, 
        taskId, 
        urlValid: videoUrl && videoUrl.startsWith('http'),
        urlFormat: videoUrl ? videoUrl.split('.').pop() : 'unknown'
      })
      
      // Auto-save video to gallery when completed
      try {
        const user = await getUserFromRequest(request)
        if (user) {
          // Retrieve stored generation parameters
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          const { data: generationData, error: fetchError } = await supabase
            .from('playground_video_generations')
            .select('*')
            .eq('id', taskId)
            .single()

          if (fetchError) {
            console.error('Failed to fetch generation parameters:', fetchError)
          }

          // Update the video URL in the database
          if (generationData) {
            await supabase
              .from('playground_video_generations')
              .update({ video_url: videoUrl })
              .eq('id', taskId)
          }

          // Auto-save to gallery with actual parameters
          const authHeader = request.headers.get('Authorization')
          if (authHeader) {
            const metadata = generationData?.generation_metadata || {}
            
            // Use the same base URL as the current request
            const baseUrl = request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000'
            
            console.log('Auto-saving video to gallery:', { baseUrl, videoUrl, taskId })
            
            const saveResponse = await fetch(`${baseUrl}/api/playground/save-video-to-gallery`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
              },
              body: JSON.stringify({
                videoUrl,
                title: 'Generated Video',
                description: 'AI-generated video from playground',
                tags: ['ai-generated', 'video'],
                duration: generationData?.duration || 5,
                resolution: generationData?.resolution || '480p',
                aspectRatio: metadata.aspect_ratio || '1:1',
                motionType: metadata.motion_type || 'moderate',
                prompt: metadata.prompt || 'AI-generated video',
                generationMetadata: {
                  generated_at: new Date().toISOString(),
                  credits_used: 8,
                  duration: generationData?.duration || 5,
                  resolution: generationData?.resolution || '480p',
                  aspect_ratio: metadata.aspect_ratio || '1:1',
                  motion_type: metadata.motion_type || 'moderate',
                  image_url: metadata.image_url,
                  task_id: taskId
                }
              })
            })

            if (saveResponse.ok) {
              const saveResult = await saveResponse.json()
              console.log('✅ Video automatically saved to gallery:', saveResult)
            } else {
              const errorText = await saveResponse.text()
              console.log('❌ Failed to auto-save video to gallery:', { 
                status: saveResponse.status, 
                error: errorText 
              })
            }
          }
        }
      } catch (error) {
        console.error('Error auto-saving video to gallery:', error)
      }
      
      return NextResponse.json({
        success: true,
        status: 'completed',
        videoUrl,
        taskId: result.data?.id || result.id,
        hasNsfwContents: result.data?.has_nsfw_contents?.[0] || result.has_nsfw_contents?.[0] || false
      })
    } else if (status === 'failed') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: result.data?.error || result.error || 'Video generation failed'
      })
    } else {
      // Task is still processing
      return NextResponse.json({
        success: true,
        status: 'processing',
        taskId: result.data?.id || result.id,
        message: 'Video generation in progress...'
      })
    }

  } catch (error) {
    console.error('Video status check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check video status' },
      { status: 500 }
    )
  }
}
