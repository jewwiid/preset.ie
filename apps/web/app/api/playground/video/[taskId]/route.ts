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
    console.log('🎬 WaveSpeed API raw response for taskId', taskId, ':', JSON.stringify(result, null, 2))
    console.log('🎬 Response keys:', Object.keys(result))
    console.log('🎬 Has data wrapper?', !!result.data)
    console.log('🎬 Response status field:', result.status)
    console.log('🎬 Response data.status field:', result.data?.status)
    console.log('🎬 Response outputs field:', result.outputs)
    console.log('🎬 Response data.outputs field:', result.data?.outputs)

    // Handle the actual WaveSpeed API response format
    // Try both wrapped and flat formats
    const status = result.data?.status || result.status
    const outputs = result.data?.outputs || result.outputs

    console.log('🎬 Final parsed - status:', status, 'outputs:', outputs, 'outputsLength:', outputs?.length)
    
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

          // Note: Videos are now only stored in playground_video_generations table
          // Users can manually save to gallery if they want to keep them permanently
          console.log('✅ Video generation completed and stored in playground_video_generations table')
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
