import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  console.log('🎬 Save-video-to-gallery API called')
  
  try {
    const { user, error: authError } = await getUserFromRequest(request)
    console.log('🔐 Auth result:', { user: user?.id, authError })
    
    const { 
      videoUrl, 
      title, 
      description, 
      tags, 
      projectId, 
      duration,
      resolution,
      aspectRatio,
      motionType,
      prompt,
      overrideExisting, 
      generationMetadata 
    } = await request.json()
  
    console.log('📝 Request data:', { 
      videoUrl, 
      title, 
      description, 
      tags, 
      projectId, 
      duration,
      resolution,
      aspectRatio,
      motionType,
      prompt,
      overrideExisting, 
      generationMetadata 
    })
    
    if (!user) {
      console.log('❌ No user found, returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      console.log('❌ Supabase admin client not available')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    
    // Check if video already exists in user's gallery
    console.log('🔍 Checking for existing video in gallery...')
    const { data: existingVideo, error: checkError } = await supabaseAdmin
      .from('playground_gallery')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .eq('video_url', videoUrl)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking for existing video:', checkError)
      throw checkError
    }
    
    if (existingVideo && !overrideExisting) {
      console.log('⚠️ Video already exists in gallery:', existingVideo)
      return NextResponse.json({
        success: false,
        error: 'duplicate',
        message: 'This video is already saved in your gallery',
        existingVideo: {
          id: existingVideo.id,
          title: existingVideo.title,
          created_at: existingVideo.created_at
        }
      }, { status: 409 }) // Conflict status
    }
    
    // If video exists and override is requested, update it
    if (existingVideo && overrideExisting) {
      console.log('🔄 Updating existing video:', existingVideo.id)
      
      const { data: updatedVideo, error: updateError } = await supabaseAdmin
        .from('playground_gallery')
        .update({
          title: title || existingVideo.title,
          description,
          tags: tags || [],
          generation_metadata: generationMetadata || {},
          video_duration: duration,
          video_resolution: resolution,
          video_format: 'mp4',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVideo.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Error updating existing video:', updateError)
        throw updateError
      }
      
      console.log('✅ Successfully updated existing video:', updatedVideo)
      
      return NextResponse.json({ 
        success: true, 
        galleryItem: updatedVideo,
        action: 'updated'
      })
    }
    
    console.log('💾 Attempting to insert video into playground_gallery table')
    
    // Save video to gallery
    const insertData = {
      user_id: user.id,
      project_id: projectId,
      media_type: 'video',
      image_url: videoUrl, // Use video URL as image_url to satisfy NOT NULL constraint
      video_url: videoUrl,
      thumbnail_url: videoUrl, // Use video URL as thumbnail for now
      title: title || 'Untitled Video',
      description,
      tags: tags || [],
      width: resolution === '720p' ? 1280 : 854,
      height: resolution === '720p' ? 720 : 480,
      file_size: 0, // Unknown size for external URLs
      video_duration: duration,
      video_resolution: resolution,
      video_format: 'mp4',
      generation_metadata: generationMetadata || {}
    }
    
    console.log('📝 Insert data:', insertData)
    
    const { data: galleryItem, error: insertError } = await supabaseAdmin
      .from('playground_gallery')
      .insert(insertData)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Gallery insert error:', insertError)
      throw insertError
    }
    
    console.log('✅ Successfully saved video to gallery:', galleryItem)
    
    return NextResponse.json({ 
      success: true, 
      galleryItem,
      action: 'created'
    })
  } catch (error) {
    console.error('❌ Failed to save video to gallery:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save video to gallery',
      details: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      hint: (error as any)?.hint
    }, { status: 500 })
  }
}
