import { createClient } from '@supabase/supabase-js'
import { StockPhoto, StockPhotoProvider } from '../types/stock-photo.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface StockPhotoDownloadResult {
  success: boolean
  permanentUrl?: string
  mediaId?: string
  error?: string
  metadata?: {
    fileName: string
    fileSize: number
    mimeType: string
    bucket: string
    path: string
    provider: StockPhotoProvider
    photographer: string
    attribution: string
  }
}

export class StockPhotoDownloaderService {
  private supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  /**
   * Downloads a stock photo from external URL and saves it to user's storage
   */
  async downloadAndSaveStockPhoto(
    stockPhoto: StockPhoto,
    userId: string,
    purpose: 'moodboard' | 'featured' | 'gallery' = 'moodboard'
  ): Promise<StockPhotoDownloadResult> {
    try {
      console.log(`🔄 Downloading ${stockPhoto.provider} photo:`, stockPhoto.id)
      
      // Download the high-resolution image
      const response = await fetch(stockPhoto.src.original || stockPhoto.src.large2x || stockPhoto.url)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
      }
      
      const imageBuffer = await response.arrayBuffer()
      const imageBlob = new Blob([imageBuffer])
      
      // Get file info
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const fileExt = contentType.includes('jpeg') ? 'jpg' : 
                     contentType.includes('png') ? 'png' : 
                     contentType.includes('webp') ? 'webp' : 'jpg'
      
      // Generate unique filename with provider prefix
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const fileName = `${stockPhoto.provider}-${stockPhoto.id}-${timestamp}-${randomStr}.${fileExt}`
      const filePath = `stock-photos/${userId}/${fileName}`
      
      console.log('💾 Saving stock photo to bucket:', filePath)
      
      // Upload to user-media bucket
      const { data: uploadData, error: uploadError } = await this.supabaseAdmin.storage
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
      const { data: { publicUrl } } = this.supabaseAdmin.storage
        .from('user-media')
        .getPublicUrl(filePath)
      
      console.log('✅ Stock photo saved successfully:', publicUrl)
      
      // Save comprehensive metadata to user_media table
      const { data: mediaData, error: mediaError } = await this.supabaseAdmin
        .from('user_media')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_path: publicUrl,
          file_size: imageBlob.size,
          mime_type: contentType,
          width: stockPhoto.width,
          height: stockPhoto.height,
          upload_purpose: purpose,
          
          // Store stock photo metadata in the existing metadata field
          metadata: {
            // Stock photo specific metadata
            provider: stockPhoto.provider,
            provider_id: stockPhoto.id,
            original_url: stockPhoto.url,
            photographer: stockPhoto.photographer,
            photographer_url: stockPhoto.photographer_url,
            attribution: stockPhoto.attribution,
            alt_text: stockPhoto.alt,
            avg_color: stockPhoto.avg_color,
            downloaded_at: new Date().toISOString(),
            purpose: purpose,
            permanently_stored: true,
            storage_method: 'downloaded_from_api',
            source_urls: {
              original: stockPhoto.src.original,
              large2x: stockPhoto.src.large2x,
              large: stockPhoto.src.large,
              medium: stockPhoto.src.medium,
              small: stockPhoto.src.small,
              portrait: stockPhoto.src.portrait,
              landscape: stockPhoto.src.landscape,
              tiny: stockPhoto.src.tiny
            }
          },
          
          // Color palette for moodboard integration
          palette: stockPhoto.avg_color ? [stockPhoto.avg_color] : []
        })
        .select()
        .single()
      
      if (mediaError) {
        console.warn('⚠️ Failed to save media metadata:', mediaError)
        // Don't fail the whole operation for metadata issues
      }
      
      return {
        success: true,
        permanentUrl: publicUrl,
        mediaId: mediaData?.id,
        metadata: {
          fileName,
          fileSize: imageBlob.size,
          mimeType: contentType,
          bucket: 'user-media',
          path: filePath,
          provider: stockPhoto.provider,
          photographer: stockPhoto.photographer,
          attribution: stockPhoto.attribution
        }
      }
      
    } catch (error) {
      console.error('❌ Stock photo download/save failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Downloads multiple stock photos in batch
   */
  async downloadAndSaveStockPhotos(
    stockPhotos: StockPhoto[],
    userId: string,
    purpose: 'moodboard' | 'featured' | 'gallery' = 'moodboard'
  ): Promise<StockPhotoDownloadResult[]> {
    const results: StockPhotoDownloadResult[] = []
    
    // Process photos in parallel (but limit concurrency to avoid rate limits)
    const batchSize = 3
    for (let i = 0; i < stockPhotos.length; i += batchSize) {
      const batch = stockPhotos.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(photo => this.downloadAndSaveStockPhoto(photo, userId, purpose))
      )
      results.push(...batchResults)
      
      // Small delay between batches to be respectful to APIs
      if (i + batchSize < stockPhotos.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  /**
   * Checks if a stock photo is already downloaded for a user
   */
  async isStockPhotoDownloaded(
    provider: StockPhotoProvider,
    providerId: string,
    userId: string
  ): Promise<{ downloaded: boolean; mediaId?: string; url?: string }> {
    try {
      const { data } = await this.supabaseAdmin
        .from('user_media')
        .select('id, file_path')
        .eq('user_id', userId)
        .eq('metadata->>provider', provider)
        .eq('metadata->>provider_id', providerId)
        .single()
      
      return {
        downloaded: !!data,
        mediaId: data?.id,
        url: data?.file_path
      }
    } catch {
      return { downloaded: false }
    }
  }

  /**
   * Gets all downloaded stock photos for a user
   */
  async getUserStockPhotos(
    userId: string,
    provider?: StockPhotoProvider
  ): Promise<any[]> {
    try {
      let query = this.supabaseAdmin
        .from('user_media')
        .select('*')
        .eq('user_id', userId)
        .not('metadata->>provider', 'is', null)
        .order('created_at', { ascending: false })
      
      if (provider) {
        query = query.eq('metadata->>provider', provider)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching user stock photos:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching user stock photos:', error)
      return []
    }
  }

  /**
   * Deletes a downloaded stock photo
   */
  async deleteStockPhoto(
    mediaId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the media record first
      const { data: mediaData, error: fetchError } = await this.supabaseAdmin
        .from('user_media')
        .select('file_path')
        .eq('id', mediaId)
        .eq('user_id', userId)
        .single()
      
      if (fetchError || !mediaData) {
        throw new Error('Media record not found')
      }
      
      // Extract file path from URL
      const urlParts = mediaData.file_path.split('/user-media/')
      if (urlParts.length < 2) {
        throw new Error('Invalid image URL format')
      }
      
      const filePath = urlParts[1]
      
      // Delete from storage
      const { error: storageError } = await this.supabaseAdmin.storage
        .from('user-media')
        .remove([filePath])
      
      if (storageError) {
        console.error('❌ Storage deletion error:', storageError)
        throw new Error(`Failed to delete from storage: ${storageError.message}`)
      }
      
      // Delete from user_media table
      const { error: mediaError } = await this.supabaseAdmin
        .from('user_media')
        .delete()
        .eq('id', mediaId)
        .eq('user_id', userId)
      
      if (mediaError) {
        console.warn('⚠️ Failed to delete media metadata:', mediaError)
        // Don't fail the whole operation for metadata issues
      }
      
      console.log('✅ Stock photo deleted successfully')
      return { success: true }
      
    } catch (error) {
      console.error('❌ Stock photo deletion failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
