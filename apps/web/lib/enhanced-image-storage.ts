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
