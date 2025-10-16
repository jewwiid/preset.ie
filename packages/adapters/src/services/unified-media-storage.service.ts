import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface UnifiedMediaStorageResult {
  success: boolean
  mediaId?: string
  publicUrl?: string
  error?: string
  metadata?: {
    fileName: string
    fileSize: number
    mimeType: string
    bucket: string
    path: string
  }
}

export interface MediaSource {
  source_type: 'upload' | 'playground' | 'enhanced' | 'stock'
  enhancement_type?: string
  original_media_id?: string
  metadata?: Record<string, any>
}

/**
 * Unified function to save enhanced images from moodboard editor
 * Replaces both downloadAndSaveEnhancedImage and downloadAndSaveEnhancedImageToGallery
 */
export async function saveEnhancedImageUnified(
  externalUrl: string,
  userId: string,
  originalImageId: string,
  enhancementType: string,
  enhancementMetadata?: any
): Promise<UnifiedMediaStorageResult> {
  try {
    console.log('🔄 Downloading enhanced image from:', externalUrl)

    // Download the image from external URL
    const response = await fetch(externalUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const imageBlob = new Blob([imageBuffer])

    // Get file info
    const contentType = response.headers.get('content-type') || 'image/png'
    const fileExt = contentType.includes('jpeg') ? 'jpg' :
                   contentType.includes('png') ? 'png' :
                   contentType.includes('webp') ? 'webp' : 'png'

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const fileName = `enhanced-${userId}-${originalImageId}-${enhancementType}-${timestamp}-${randomStr}.${fileExt}`
    const filePath = `enhanced/${userId}/${fileName}`

    console.log('💾 Saving enhanced image to unified storage:', filePath)

    // Create Supabase admin client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Upload to user-media bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('user-media')
      .upload(filePath, imageBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      throw new Error(`Failed to upload to bucket: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('user-media')
      .getPublicUrl(filePath)

    console.log('✅ Enhanced image saved successfully:', publicUrl)

    // Create unified media table entry
    const imageWidth = enhancementMetadata?.width || 1024
    const imageHeight = enhancementMetadata?.height || 1024

    const mediaData = {
      owner_user_id: userId,
      type: 'image',
      bucket: 'user-media',
      path: filePath,
      url: publicUrl,
      width: imageWidth,
      height: imageHeight,
      visibility: 'private', // Enhanced images start as private
      source_type: 'enhanced' as const,
      enhancement_type: enhancementType,
      original_media_id: originalImageId,
      metadata: {
        ...enhancementMetadata,
        external_url: externalUrl,
        enhanced_at: new Date().toISOString(),
        provider: enhancementMetadata?.provider || 'unknown',
        credits_used: 1,
        enhancement_metadata: {
          prompt: enhancementMetadata?.prompt || '',
          style: enhancementType,
          provider: enhancementMetadata?.provider || 'unknown',
          enhanced_at: new Date().toISOString()
        }
      }
    }

    const { data: mediaItem, error: mediaError } = await supabaseAdmin
      .from('media')
      .insert(mediaData)
      .select()
      .single()

    if (mediaError) {
      console.error('❌ Failed to create media entry:', mediaError)
      throw new Error(`Failed to create media entry: ${mediaError.message}`)
    }

    console.log('✅ Media entry created successfully:', mediaItem.id)

    return {
      success: true,
      mediaId: mediaItem.id,
      publicUrl,
      metadata: {
        fileName,
        fileSize: imageBlob.size,
        mimeType: contentType,
        bucket: 'user-media',
        path: filePath
      }
    }

  } catch (error) {
    console.error('❌ Enhanced image save failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Upload a user image with unified storage
 */
export async function uploadUserImage(
  imageFile: File,
  userId: string,
  source: MediaSource
): Promise<UnifiedMediaStorageResult> {
  try {
    const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `uploads/${userId}/images/${fileName}`

    console.log('💾 Uploading user image to:', filePath)

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Upload to user-media bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('user-media')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: imageFile.type
      })

    if (uploadError) {
      throw new Error(`Failed to upload: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('user-media')
      .getPublicUrl(filePath)

    // Create media entry
    const mediaData = {
      owner_user_id: userId,
      type: 'image',
      bucket: 'user-media',
      path: filePath,
      url: publicUrl,
      visibility: 'public',
      source_type: source.source_type,
      enhancement_type: source.enhancement_type,
      original_media_id: source.original_media_id,
      metadata: {
        file_name: imageFile.name,
        file_size: imageFile.size,
        mime_type: imageFile.type,
        uploaded_at: new Date().toISOString(),
        ...source.metadata
      }
    }

    const { data: mediaItem, error: mediaError } = await supabaseAdmin
      .from('media')
      .insert(mediaData)
      .select()
      .single()

    if (mediaError) {
      throw new Error(`Failed to create media entry: ${mediaError.message}`)
    }

    return {
      success: true,
      mediaId: mediaItem.id,
      publicUrl,
      metadata: {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        mimeType: imageFile.type,
        bucket: 'user-media',
        path: filePath
      }
    }

  } catch (error) {
    console.error('❌ User image upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Upload a user video (foundation for video support)
 */
export async function uploadUserVideo(
  videoFile: File,
  userId: string,
  metadata?: Record<string, any>
): Promise<UnifiedMediaStorageResult> {
  try {
    const fileExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4'
    const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `uploads/${userId}/videos/${fileName}`

    console.log('💾 Uploading user video to:', filePath)

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Upload to user-media bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('user-media')
      .upload(filePath, videoFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: videoFile.type
      })

    if (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('user-media')
      .getPublicUrl(filePath)

    // Create media entry
    const mediaData = {
      owner_user_id: userId,
      type: 'video',
      bucket: 'user-media',
      path: filePath,
      url: publicUrl,
      visibility: 'private', // Videos start as private
      source_type: 'upload' as const,
      metadata: {
        file_name: videoFile.name,
        file_size: videoFile.size,
        mime_type: videoFile.type,
        uploaded_at: new Date().toISOString(),
        duration: metadata?.duration,
        resolution: metadata?.resolution,
        format: videoFile.type,
        ...metadata
      }
    }

    const { data: mediaItem, error: mediaError } = await supabaseAdmin
      .from('media')
      .insert(mediaData)
      .select()
      .single()

    if (mediaError) {
      throw new Error(`Failed to create media entry: ${mediaError.message}`)
    }

    return {
      success: true,
      mediaId: mediaItem.id,
      publicUrl,
      metadata: {
        fileName: videoFile.name,
        fileSize: videoFile.size,
        mimeType: videoFile.type,
        bucket: 'user-media',
        path: filePath
      }
    }

  } catch (error) {
    console.error('❌ User video upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete media from unified storage
 */
export async function deleteMediaUnified(
  mediaId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get media info first
    const { data: mediaItem, error: fetchError } = await supabaseAdmin
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .eq('owner_user_id', userId)
      .single()

    if (fetchError || !mediaItem) {
      throw new Error('Media not found or access denied')
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(mediaItem.bucket)
      .remove([mediaItem.path])

    if (storageError) {
      console.warn('⚠️ Storage deletion failed:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete from media table
    const { error: mediaError } = await supabaseAdmin
      .from('media')
      .delete()
      .eq('id', mediaId)
      .eq('owner_user_id', userId)

    if (mediaError) {
      throw new Error(`Failed to delete media entry: ${mediaError.message}`)
    }

    console.log('✅ Media deleted successfully:', mediaId)
    return { success: true }

  } catch (error) {
    console.error('❌ Media deletion failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get unified media list for a user
 */
export async function getUserUnifiedMedia(
  userId: string,
  sourceType?: MediaSource['source_type'],
  mediaType?: 'image' | 'video'
) {
  try {
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    let query = supabase
      .from('media')
      .select('*')
      .eq('owner_user_id', userId)

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    if (mediaType) {
      query = query.eq('type', mediaType)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch media: ${error.message}`)
    }

    return data

  } catch (error) {
    console.error('❌ Failed to fetch user media:', error)
    return []
  }
}