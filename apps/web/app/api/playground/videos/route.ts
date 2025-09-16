import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '../../../../lib/auth-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🎬 Fetching user videos...')
    
    const { user, error: authError } = await getUserFromRequest(request)
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Fetch videos from playground_gallery (saved videos)
    const { data: savedVideos, error: savedVideosError } = await supabaseAdmin
      .from('playground_gallery')
      .select(`
        id,
        title,
        description,
        video_url,
        video_duration,
        video_resolution,
        video_format,
        generation_metadata,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('media_type', 'video')
      .order('created_at', { ascending: false })
      .limit(50)

    if (savedVideosError) {
      console.error('❌ Error fetching saved videos:', savedVideosError)
    }

    // Fetch videos from playground_video_generations (recent generations)
    const { data: generatedVideos, error: generatedVideosError } = await supabaseAdmin
      .from('playground_video_generations')
      .select(`
        id,
        video_url,
        duration,
        resolution,
        generation_metadata,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (generatedVideosError) {
      console.error('❌ Error fetching generated videos:', generatedVideosError)
    }

    // Combine and format videos
    const allVideos = [
      // Saved videos from gallery
      ...(savedVideos?.map(video => ({
        id: `saved_${video.id}`,
        url: video.video_url,
        title: video.title || 'Generated Video',
        duration: video.video_duration,
        resolution: video.video_resolution,
        aspectRatio: video.generation_metadata?.aspect_ratio || '1:1',
        generated_at: video.created_at,
        is_saved: true,
        source: 'gallery'
      })) || []),
      
      // Generated videos from video_generations table
      ...(generatedVideos?.map(video => ({
        id: `gen_${video.id}`,
        url: video.video_url,
        title: 'Generated Video',
        duration: video.duration,
        resolution: video.resolution,
        aspectRatio: video.generation_metadata?.aspect_ratio || '1:1',
        generated_at: video.created_at,
        is_saved: false,
        source: 'generation'
      })) || [])
    ]

    // Remove duplicates and sort by creation date
    // Prioritize saved videos over generated videos when URLs match
    const uniqueVideos = allVideos
      .filter((video, index, self) => {
        const firstIndex = self.findIndex(v => v.url === video.url)
        if (firstIndex === index) return true // First occurrence, keep it
        
        // If this is a duplicate, prefer the saved version
        const firstVideo = self[firstIndex]
        if (video.is_saved && !firstVideo.is_saved) {
          // Replace the unsaved version with the saved version
          self[firstIndex] = video
          return false // Remove this duplicate
        }
        
        return false // Remove this duplicate
      })
      .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())

    console.log(`✅ Found ${uniqueVideos.length} videos for user ${user.id}`)

    return NextResponse.json({
      videos: uniqueVideos,
      count: uniqueVideos.length
    })

  } catch (error) {
    console.error('❌ Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}
