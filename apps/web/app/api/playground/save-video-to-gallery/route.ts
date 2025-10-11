import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  console.log('🎬 Save-video-to-gallery API called')

  try {
    const { user, error: authError } = await getUserFromRequest(request)
    console.log('🔐 Auth result:', { user: user?.id, authError })

    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed', details: authError }, { status: 401 })
    }
    
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
      
      // Extract actual video dimensions from the video URL
      let actualWidth = resolution === '720p' ? 1280 : 854
      let actualHeight = resolution === '720p' ? 720 : 480
      
      try {
        // Try to extract dimensions from the video URL or metadata
        if (generationMetadata?.width && generationMetadata?.height) {
          actualWidth = generationMetadata.width
          actualHeight = generationMetadata.height
        } else if (generationMetadata?.aspect_ratio) {
          // Calculate dimensions from aspect ratio
          const dimensions = calculateDimensionsFromAspectRatio(generationMetadata.aspect_ratio, resolution)
          actualWidth = dimensions.width
          actualHeight = dimensions.height
        } else if (resolution) {
          // Parse resolution string like "854x480" or "1280x720"
          const resolutionMatch = resolution.match(/(\d+)x(\d+)/i)
          if (resolutionMatch) {
            actualWidth = parseInt(resolutionMatch[1])
            actualHeight = parseInt(resolutionMatch[2])
          }
        }
      } catch (error) {
        console.warn('Could not extract video dimensions, using defaults:', error)
      }
      
      const { data: updatedVideo, error: updateError } = await supabaseAdmin
        .from('playground_gallery')
        .update({
          title: title || existingVideo.title,
          description,
          tags: tags || [],
          width: actualWidth,
          height: actualHeight,
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
    
    console.log('💾 Attempting to save video to Supabase Storage and insert into playground_gallery table')

    // Step 1: Download video from external URL (CloudFront)
    console.log('📥 Downloading video from:', videoUrl)
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`)
    }

    const videoBlob = await videoResponse.arrayBuffer()
    const videoBuffer = Buffer.from(videoBlob)
    console.log('✅ Video downloaded, size:', videoBuffer.length, 'bytes')

    // Step 2: Upload to Supabase Storage (playground-videos bucket, /saved/ folder)
    const fileExtension = 'mp4'
    const fileName = `${user.id}/saved/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const bucketName = 'playground-videos'

    console.log('📤 Uploading video to Supabase Storage:', fileName)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Failed to upload video to storage:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Step 3: Get the public URL from Supabase Storage
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    const supabaseVideoUrl = publicUrlData.publicUrl
    console.log('✅ Video uploaded to Supabase Storage:', supabaseVideoUrl)

    // Extract actual video dimensions from the video URL
    let actualWidth = resolution === '720p' ? 1280 : 854
    let actualHeight = resolution === '720p' ? 720 : 480
    
    try {
      // Try to extract dimensions from the video URL or metadata
      if (generationMetadata?.width && generationMetadata?.height) {
        actualWidth = generationMetadata.width
        actualHeight = generationMetadata.height
      } else if (generationMetadata?.aspect_ratio) {
        // Calculate dimensions from aspect ratio
        const dimensions = calculateDimensionsFromAspectRatio(generationMetadata.aspect_ratio, resolution)
        actualWidth = dimensions.width
        actualHeight = dimensions.height
      } else if (resolution) {
        // Parse resolution string like "854x480" or "1280x720"
        const resolutionMatch = resolution.match(/(\d+)x(\d+)/i)
        if (resolutionMatch) {
          actualWidth = parseInt(resolutionMatch[1])
          actualHeight = parseInt(resolutionMatch[2])
        }
      }
    } catch (error) {
      console.warn('Could not extract video dimensions, using defaults:', error)
    }

    // Save video to gallery with Supabase Storage URL
    const insertData: any = {
      user_id: user.id,
      project_id: projectId,
      media_type: 'video',
      image_url: supabaseVideoUrl, // Use Supabase video URL
      video_url: supabaseVideoUrl, // Permanent URL in our storage
      thumbnail_url: null, // Let video element generate first frame automatically
      title: title || 'Untitled Video',
      description,
      tags: tags || [],
      width: actualWidth,
      height: actualHeight,
      video_duration: duration,
      video_resolution: resolution,
      video_format: 'mp4',
      generation_metadata: {
        ...generationMetadata,
        original_cloudfront_url: videoUrl, // Keep reference to original URL
        saved_to_storage: true,
        storage_path: fileName
        // Base image URLs stay as-is (in playground-uploads/base-images/)
      }
    }

    // Only include file_size if the column exists (optional field)
    // Removed file_size: 0 since column doesn't exist in schema
    
    console.log('📝 Insert data:', JSON.stringify(insertData, null, 2))

    const { data: galleryItem, error: insertError } = await supabaseAdmin
      .from('playground_gallery')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Gallery insert error:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        insertData
      })
      return NextResponse.json({
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 })
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

function calculateDimensionsFromAspectRatio(aspectRatio: string, resolution: string): { width: number; height: number } {
  // Define target dimensions based on aspect ratio and resolution
  const resolutionMap = {
    '480p': { baseWidth: 854, baseHeight: 480 },
    '720p': { baseWidth: 1280, baseHeight: 720 }
  }
  
  const baseDimensions = resolutionMap[resolution as keyof typeof resolutionMap] || resolutionMap['480p']
  
  switch (aspectRatio) {
    case '1:1':
      const size = Math.min(baseDimensions.baseWidth, baseDimensions.baseHeight)
      return { width: size, height: size }
    case '16:9':
      return { width: baseDimensions.baseWidth, height: baseDimensions.baseHeight }
    case '9:16':
      return { width: baseDimensions.baseHeight, height: baseDimensions.baseWidth }
    case '21:9':
      // Ultra-wide aspect ratio
      const width219 = baseDimensions.baseWidth
      const height219 = Math.round(width219 * 9 / 21)
      return { width: width219, height: height219 }
    case '4:3':
      const width43 = baseDimensions.baseWidth
      const height43 = Math.round(width43 * 3 / 4)
      return { width: width43, height: height43 }
    case '3:4':
      const height34 = baseDimensions.baseHeight
      const width34 = Math.round(height34 * 3 / 4)
      return { width: width34, height: height34 }
    default:
      return { width: baseDimensions.baseWidth, height: baseDimensions.baseHeight }
  }
}
