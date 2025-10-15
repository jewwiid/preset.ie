import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface EnhancedImageStorageResult {
  success: boolean
  permanentUrl?: string
  error?: string
  metadata?: {
    fileName: string
    fileSize: number
    mimeType: string
    bucket: string
    path: string
  }
}

/**
 * Downloads an enhanced image from an external URL and saves it to the user's bucket
 */
export async function downloadAndSaveEnhancedImage(
  externalUrl: string,
  userId: string,
  originalImageId: string,
  enhancementType: string
): Promise<EnhancedImageStorageResult> {
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
    const filePath = `enhanced-images/${userId}/${fileName}`
    
    console.log('💾 Saving enhanced image to bucket:', filePath)
    
    // Create Supabase admin client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Upload to user-media bucket (or create enhanced-images bucket)
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
    
    // Save metadata to user_media table for tracking
    const { error: mediaError } = await supabaseAdmin
      .from('user_media')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_path: publicUrl,
        file_size: imageBlob.size,
        mime_type: contentType,
        upload_purpose: 'enhanced_image',
        metadata: {
          original_image_id: originalImageId,
          enhancement_type: enhancementType,
          source: 'ai_enhancement',
          external_url: externalUrl
        }
      })
    
    if (mediaError) {
      console.warn('⚠️ Failed to save media metadata:', mediaError)
      // Don't fail the whole operation for metadata issues
    }
    
    return {
      success: true,
      permanentUrl: publicUrl,
      metadata: {
        fileName,
        fileSize: imageBlob.size,
        mimeType: contentType,
        bucket: 'user-media',
        path: filePath
      }
    }
    
  } catch (error) {
    console.error('❌ Enhanced image download/save failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Deletes an enhanced image from storage and database
 */
export async function deleteEnhancedImage(
  imageUrl: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Extract file path from URL
    const urlParts = imageUrl.split('/user-media/')
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL format')
    }
    
    const filePath = urlParts[1]
    
    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('user-media')
      .remove([filePath])
    
    if (storageError) {
      console.error('❌ Storage deletion error:', storageError)
      throw new Error(`Failed to delete from storage: ${storageError.message}`)
    }
    
    // Delete from user_media table
    const { error: mediaError } = await supabaseAdmin
      .from('user_media')
      .delete()
      .eq('file_path', imageUrl)
      .eq('user_id', userId)
    
    if (mediaError) {
      console.warn('⚠️ Failed to delete media metadata:', mediaError)
      // Don't fail the whole operation for metadata issues
    }
    
    console.log('✅ Enhanced image deleted successfully')
    return { success: true }
    
  } catch (error) {
    console.error('❌ Enhanced image deletion failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Checks if an image URL is external (not from our bucket)
 */
export function isExternalImageUrl(url: string): boolean {
  if (!url) return false
  
  const supabaseDomain = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '')
  if (!supabaseDomain) return true
  
  try {
    const urlObj = new URL(url)
    return !urlObj.hostname.includes(supabaseDomain)
  } catch {
    return true
  }
}

/**
 * Downloads an enhanced image from an external URL and saves it to the user's gallery (playground_gallery table)
 */
export async function downloadAndSaveEnhancedImageToGallery(
  externalUrl: string,
  userId: string,
  originalImageId: string,
  enhancementType: string,
  enhancementMetadata?: any
): Promise<EnhancedImageStorageResult> {
  try {
    console.log('🔄 Downloading enhanced image to gallery from:', externalUrl)

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
    const filePath = `enhanced-images/${userId}/${fileName}`

    console.log('💾 Saving enhanced image to bucket:', filePath)

    // Create Supabase admin client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Upload to playground-images bucket (for consistency with playground saves)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('playground-images')
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
      .from('playground-images')
      .getPublicUrl(filePath)

    console.log('✅ Enhanced image saved successfully:', publicUrl)

    // Save to playground_gallery table for proper gallery integration
    try {
      const imageWidth = enhancementMetadata?.width || 1024
      const imageHeight = enhancementMetadata?.height || 1024

      const galleryData = {
        user_id: userId,
        image_url: publicUrl,
        thumbnail_url: publicUrl,
        title: `Enhanced ${enhancementType}`,
        description: `AI-enhanced image using ${enhancementType} enhancement`,
        tags: [enhancementType, 'ai-enhanced'],
        width: imageWidth,
        height: imageHeight,
        format: fileExt,
        generation_metadata: {
          prompt: enhancementMetadata?.prompt || '',
          style: enhancementMetadata?.provider || 'ai-enhanced',
          aspect_ratio: `${imageWidth}:${imageHeight}`,
          resolution: `${imageWidth}*${imageHeight}`,
          consistency_level: 'standard',
          enhanced_prompt: enhancementMetadata?.prompt || '',
          style_applied: enhancementType,
          credits_used: 1,
          generated_at: new Date().toISOString(),
          provider: enhancementMetadata?.provider || 'unknown',
          source: 'ai_enhancement',
          original_url: externalUrl,
          permanently_stored: true,
          storage_method: 'downloaded',
          enhancement_type: enhancementType,
          enhanced_at: new Date().toISOString()
        },
        exif_json: {
          promoted_from_moodboard: true,
          enhancement_metadata: {
            prompt: enhancementMetadata?.prompt || '',
            style: enhancementType,
            provider: enhancementMetadata?.provider || 'unknown',
            enhanced_at: new Date().toISOString()
          }
        },
        // Set default values for required fields
        used_in_moodboard: false,
        used_in_showcase: false,
        media_type: 'image',
        is_nsfw: false,
        is_flagged: false,
        moderation_status: 'pending',
        user_marked_nsfw: false,
        nsfw_confidence_score: 0.0
      }

      const { data: galleryItem, error: galleryError } = await supabaseAdmin
        .from('playground_gallery')
        .insert(galleryData)
        .select()
        .single()

      if (galleryError) {
        console.warn('⚠️ Failed to save to gallery:', galleryError)
      } else {
        console.log('✅ Enhanced image saved to gallery:', galleryItem.id)
      }
    } catch (galleryError) {
      console.warn('⚠️ Failed to save to gallery:', galleryError)
      // Don't fail the whole operation for gallery issues
    }

    return {
      success: true,
      permanentUrl: publicUrl,
      metadata: {
        fileName,
        fileSize: imageBlob.size,
        mimeType: contentType,
        bucket: 'playground-images',
        path: filePath
      }
    }

  } catch (error) {
    console.error('❌ Enhanced image download/save failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Gets the file path from a Supabase storage URL
 */
export function getStoragePathFromUrl(url: string): string | null {
  try {
    const urlParts = url.split('/storage/v1/object/public/')
    if (urlParts.length < 2) return null

    const pathParts = urlParts[1].split('/')
    if (pathParts.length < 2) return null

    return pathParts.slice(1).join('/') // Remove bucket name
  } catch {
    return null
  }
}
