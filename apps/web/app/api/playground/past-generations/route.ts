import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Calculate date 6 days ago
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

    // Fetch user's playground projects from the last 6 days
    const { data: projects, error } = await supabaseAdmin
      .from('playground_projects')
      .select(`
        id,
        title,
        prompt,
        style,
        generated_images,
        credits_used,
        created_at,
        last_generated_at,
        status,
        metadata
      `)
      .eq('user_id', user.id)
      .gte('created_at', sixDaysAgo.toISOString())
      .order('last_generated_at', { ascending: false })
      .limit(50) // Limit to prevent large responses

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get saved projects to mark them as saved
    const { data: savedProjects, error: savedError } = await supabaseAdmin
      .from('playground_gallery')
      .select('project_id')
      .eq('user_id', user.id)
      .not('project_id', 'is', null)

    if (savedError) {
      console.error('Error fetching saved projects:', savedError)
    }

    const savedProjectIds = new Set(savedProjects?.map(p => p.project_id) || [])
    
    // Also fetch individual image edits
    const { data: edits, error: editsError } = await supabaseAdmin
      .from('playground_image_edits')
      .select(`
        id,
        project_id,
        edit_type,
        edit_prompt,
        original_image_url,
        edited_image_url,
        credits_used,
        created_at
      `)
      .eq('user_id', user.id)
      .gte('created_at', sixDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (editsError) {
      console.error('Error fetching edits:', editsError)
    }

    // Also fetch video generations from gallery
    const { data: videos, error: videosError } = await supabaseAdmin
      .from('playground_gallery')
      .select(`
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        video_duration,
        video_resolution,
        video_format,
        generation_metadata,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('media_type', 'video')
      .gte('created_at', sixDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (videosError) {
      console.error('Error fetching videos:', videosError)
    }

    // Also fetch video generations from playground_video_generations table
    const { data: videoGenerations, error: videoGenerationsError } = await supabaseAdmin
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
      .gte('created_at', sixDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (videoGenerationsError) {
      console.error('Error fetching video generations:', videoGenerationsError)
    }

    // Filter projects with images and add saved status
    const filteredProjects = projects?.filter(project => 
      project.generated_images && 
      Array.isArray(project.generated_images) && 
      project.generated_images.length > 0
    ).map(project => ({
      ...project,
      is_saved: savedProjectIds.has(project.id),
      is_video: false
    })) || []

    // Add individual edits as separate items
    const editItems = edits?.map(edit => ({
      id: `edit_${edit.id}`,
      title: `${edit.edit_type} Edit`,
      prompt: edit.edit_prompt,
      style: edit.edit_type,
      generated_images: [{
        url: edit.edited_image_url,
        width: 1024,
        height: 1024,
        generated_at: edit.created_at,
        type: 'edit'
      }],
      credits_used: edit.credits_used,
      created_at: edit.created_at,
      last_generated_at: edit.created_at,
      status: 'completed',
      is_saved: false, // Individual edits are not saved to gallery
      is_edit: true,
      is_video: false
    })) || []

    // Add video generations as separate items
    const videoItems = videos?.map(video => ({
      id: `video_${video.id}`,
      title: video.title || 'Generated Video',
      prompt: video.generation_metadata?.prompt || 'AI-generated video',
      style: 'video',
      generated_images: [{
        url: video.video_url,
        width: video.video_resolution === '720p' ? 1280 : 854,
        height: video.video_resolution === '720p' ? 720 : 480,
        generated_at: video.created_at,
        type: 'video',
        duration: video.video_duration,
        resolution: video.video_resolution
      }],
      credits_used: video.generation_metadata?.credits_used || 8,
      created_at: video.created_at,
      last_generated_at: video.created_at,
      status: 'completed',
      is_saved: true, // Videos are automatically saved to gallery
      is_video: true
    })) || []

    // Add video generations from playground_video_generations table
    const videoGenerationItems = videoGenerations?.map(videoGen => ({
      id: `video_gen_${videoGen.id}`,
      title: 'Generated Video',
      prompt: videoGen.generation_metadata?.prompt || 'AI-generated video',
      style: 'video',
      generated_images: [{
        url: videoGen.video_url || 'pending',
        width: videoGen.resolution === '720p' ? 1280 : 854,
        height: videoGen.resolution === '720p' ? 720 : 480,
        generated_at: videoGen.created_at,
        type: 'video',
        duration: videoGen.duration,
        resolution: videoGen.resolution
      }],
      credits_used: 8, // Default credits for video generation
      created_at: videoGen.created_at,
      last_generated_at: videoGen.created_at,
      status: videoGen.video_url === 'pending' ? 'processing' : 'completed',
      is_saved: false, // Not yet saved to gallery
      is_video: true
    })) || []

    // Combine projects, edits, videos, and video generations
    const allGenerations = [...filteredProjects, ...editItems, ...videoItems, ...videoGenerationItems]
    
    // Deduplicate videos by URL to prevent duplicates between gallery and generations tables
    const seenVideoUrls = new Set()
    const deduplicatedGenerations = allGenerations.filter(generation => {
      if (generation.is_video && generation.generated_images?.[0]?.url) {
        const videoUrl = generation.generated_images[0].url
        if (seenVideoUrls.has(videoUrl)) {
          console.log('Removing duplicate video:', videoUrl)
          return false
        }
        seenVideoUrls.add(videoUrl)
      }
      return true
    })
    
    // Sort by date
    const sortedGenerations = deduplicatedGenerations
      .sort((a, b) => new Date(b.last_generated_at).getTime() - new Date(a.last_generated_at).getTime())

    // Debug logging
    console.log('📊 Past Generations Debug:', {
      totalProjects: projects?.length || 0,
      totalEdits: edits?.length || 0,
      totalVideos: videos?.length || 0,
      totalVideoGenerations: videoGenerations?.length || 0,
      totalCombined: allGenerations.length,
      totalDeduplicated: deduplicatedGenerations.length,
      videos: deduplicatedGenerations.filter(g => g.is_video).length,
      images: deduplicatedGenerations.filter(g => !g.is_video).length
    })

    return NextResponse.json({
      generations: sortedGenerations,
      total: sortedGenerations.length
    })

  } catch (error) {
    console.error('Error fetching past generations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}