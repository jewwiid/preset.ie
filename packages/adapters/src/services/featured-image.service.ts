import { createClient } from '@supabase/supabase-js'
import { StockPhotoDownloaderService } from './stock-photo-downloader.service'
import { uploadUserImage } from './unified-media-storage.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface FeaturedImageResult {
  success: boolean
  featuredImageUrl?: string
  mediaId?: string
  error?: string
  metadata?: {
    provider?: string
    photographer?: string
    attribution?: string
    permanentlyStored: boolean
  }
}

export class FeaturedImageService {
  private supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  private stockPhotoDownloader = new StockPhotoDownloaderService()

  /**
   * Ensures a featured image is downloaded and stored locally
   * This is called when a moodboard is saved with a featured image
   */
  async ensureFeaturedImageDownloaded(
    moodboardId: string,
    featuredImageId: string,
    userId: string
  ): Promise<FeaturedImageResult> {
    try {
      console.log(`🔄 Ensuring featured image is downloaded: ${featuredImageId}`)
      
      // Get the moodboard to find the featured image item
      const { data: moodboard, error: moodboardError } = await this.supabaseAdmin
        .from('moodboards')
        .select('items')
        .eq('id', moodboardId)
        .eq('owner_user_id', userId)
        .single()
      
      if (moodboardError || !moodboard) {
        throw new Error('Moodboard not found')
      }
      
      // Find the featured image item
      const featuredItem = moodboard.items.find((item: any) => item.id === featuredImageId)
      if (!featuredItem) {
        throw new Error('Featured image item not found in moodboard')
      }
      
      // Check if it's already downloaded
      if (featuredItem.permanentlyStored && featuredItem.mediaId) {
        console.log('✅ Featured image already downloaded')
        return {
          success: true,
          featuredImageUrl: featuredItem.url,
          mediaId: featuredItem.mediaId,
          metadata: {
            provider: featuredItem.source,
            photographer: featuredItem.photographer,
            attribution: featuredItem.attribution,
            permanentlyStored: true
          }
        }
      }
      
      // If it's a stock photo, download it
      if (['pexels', 'unsplash', 'pixabay'].includes(featuredItem.source)) {
        console.log(`📥 Downloading featured stock photo from ${featuredItem.source}`)
        
        // Create a StockPhoto object from the moodboard item
        const stockPhoto = {
          id: featuredItem.id.replace(`${featuredItem.source}_`, ''),
          url: featuredItem.url,
          photographer: featuredItem.photographer,
          photographer_url: featuredItem.photographer_url,
          src: {
            original: featuredItem.url,
            large2x: featuredItem.url,
            large: featuredItem.url,
            medium: featuredItem.thumbnail_url || featuredItem.url,
            small: featuredItem.thumbnail_url || featuredItem.url,
            portrait: featuredItem.url,
            landscape: featuredItem.url,
            tiny: featuredItem.thumbnail_url || featuredItem.url
          },
          alt: featuredItem.caption || '',
          width: featuredItem.width,
          height: featuredItem.height,
          avg_color: '#000000',
          provider: featuredItem.source,
          attribution: featuredItem.attribution || `Photo by ${featuredItem.photographer}`
        }
        
        // Download the stock photo using unified media storage
        const unifiedResult = await this.saveFeaturedImageToUnifiedStorage(
          featuredItem,
          userId,
          moodboardId
        )

        if (unifiedResult.success) {
          // Update the moodboard item with the permanent URL
          const updatedItems = moodboard.items.map((item: any) =>
            item.id === featuredImageId
              ? {
                  ...item,
                  url: unifiedResult.publicUrl,
                  thumbnail_url: unifiedResult.publicUrl,
                  mediaId: unifiedResult.mediaId,
                  unified_media_id: unifiedResult.mediaId,
                  permanentlyStored: true,
                  downloadStatus: 'completed'
                }
              : item
          )

          // Update the moodboard in the database
          await this.supabaseAdmin
            .from('moodboards')
            .update({ items: updatedItems })
            .eq('id', moodboardId)

          console.log('✅ Featured image saved to unified storage and moodboard updated')

          return {
            success: true,
            featuredImageUrl: unifiedResult.publicUrl,
            mediaId: unifiedResult.mediaId,
            metadata: {
              provider: featuredItem.source,
              photographer: featuredItem.photographer,
              attribution: featuredItem.attribution,
              permanentlyStored: true
            }
          }
        } else {
          throw new Error(unifiedResult.error || 'Failed to save featured image to unified storage')
        }
      }
      
      // For user uploads or other sources, just return the existing URL
      return {
        success: true,
        featuredImageUrl: featuredItem.url,
        metadata: {
          provider: featuredItem.source,
          photographer: featuredItem.photographer,
          attribution: featuredItem.attribution,
          permanentlyStored: featuredItem.source === 'user-upload'
        }
      }
      
    } catch (error) {
      console.error('❌ Error ensuring featured image download:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Gets the featured image URL for a moodboard
   * This is used across all codebases to display featured images
   */
  async getFeaturedImageUrl(moodboardId: string): Promise<string | null> {
    try {
      const { data: moodboard, error } = await this.supabaseAdmin
        .from('moodboards')
        .select('featured_image_id, items')
        .eq('id', moodboardId)
        .single()
      
      if (error || !moodboard) {
        return null
      }
      
      if (!moodboard.featured_image_id || !moodboard.items) {
        return null
      }
      
      // Find the featured image item
      const featuredItem = moodboard.items.find((item: any) => 
        item.id === moodboard.featured_image_id
      )
      
      if (!featuredItem) {
        return null
      }
      
      // Return the URL (should be permanent if downloaded)
      return featuredItem.url || featuredItem.thumbnail_url || null
      
    } catch (error) {
      console.error('Error getting featured image URL:', error)
      return null
    }
  }

  /**
   * Gets featured image metadata for attribution
   */
  async getFeaturedImageMetadata(moodboardId: string): Promise<{
    photographer?: string
    photographer_url?: string
    attribution?: string
    provider?: string
  } | null> {
    try {
      const { data: moodboard, error } = await this.supabaseAdmin
        .from('moodboards')
        .select('featured_image_id, items')
        .eq('id', moodboardId)
        .single()
      
      if (error || !moodboard) {
        return null
      }
      
      if (!moodboard.featured_image_id || !moodboard.items) {
        return null
      }
      
      // Find the featured image item
      const featuredItem = moodboard.items.find((item: any) => 
        item.id === moodboard.featured_image_id
      )
      
      if (!featuredItem) {
        return null
      }
      
      return {
        photographer: featuredItem.photographer,
        photographer_url: featuredItem.photographer_url,
        attribution: featuredItem.attribution,
        provider: featuredItem.source
      }
      
    } catch (error) {
      console.error('Error getting featured image metadata:', error)
      return null
    }
  }

  /**
   * Downloads all stock photos in a moodboard when it's saved
   * This ensures all images are permanently stored
   */
  async downloadAllStockPhotos(
    moodboardId: string,
    userId: string
  ): Promise<{ downloaded: number; failed: number; errors: string[] }> {
    try {
      console.log(`🔄 Downloading all stock photos for moodboard: ${moodboardId}`)
      
      // Get the moodboard items
      const { data: moodboard, error: moodboardError } = await this.supabaseAdmin
        .from('moodboards')
        .select('items')
        .eq('id', moodboardId)
        .eq('owner_user_id', userId)
        .single()
      
      if (moodboardError || !moodboard) {
        throw new Error('Moodboard not found')
      }
      
      // Find all stock photo items that aren't already downloaded
      const stockPhotos = moodboard.items.filter((item: any) => 
        ['pexels', 'unsplash', 'pixabay'].includes(item.source) && 
        !item.permanentlyStored
      )
      
      if (stockPhotos.length === 0) {
        console.log('✅ No stock photos need downloading')
        return { downloaded: 0, failed: 0, errors: [] }
      }
      
      console.log(`📥 Downloading ${stockPhotos.length} stock photos`)
      
      // Convert moodboard items to StockPhoto objects
      const stockPhotoObjects = stockPhotos.map((item: any) => ({
        id: item.id.replace(`${item.source}_`, ''),
        url: item.url,
        photographer: item.photographer,
        photographer_url: item.photographer_url,
        src: {
          original: item.url,
          large2x: item.url,
          large: item.url,
          medium: item.thumbnail_url || item.url,
          small: item.thumbnail_url || item.url,
          portrait: item.url,
          landscape: item.url,
          tiny: item.thumbnail_url || item.url
        },
        alt: item.caption || '',
        width: item.width,
        height: item.height,
        avg_color: '#000000',
        provider: item.source,
        attribution: item.attribution || `Photo by ${item.photographer}`
      }))
      
      // Download all stock photos
      const results = await this.stockPhotoDownloader.downloadAndSaveStockPhotos(
        stockPhotoObjects,
        userId,
        'moodboard'
      )
      
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)
      
      // Update moodboard items with permanent URLs
      if (successful.length > 0) {
        const updatedItems = moodboard.items.map((item: any) => {
          const downloadResult = successful.find(r => 
            r.metadata?.fileName.includes(item.id.replace(`${item.source}_`, ''))
          )
          
          if (downloadResult) {
            return {
              ...item,
              url: downloadResult.permanentUrl,
              thumbnail_url: downloadResult.permanentUrl,
              mediaId: downloadResult.mediaId,
              permanentlyStored: true,
              downloadStatus: 'completed'
            }
          }
          
          return item
        })
        
        // Update the moodboard
        await this.supabaseAdmin
          .from('moodboards')
          .update({ items: updatedItems })
          .eq('id', moodboardId)
      }
      
      console.log(`✅ Downloaded ${successful.length}/${stockPhotos.length} stock photos`)
      
      return {
        downloaded: successful.length,
        failed: failed.length,
        errors: failed.map(f => f.error || 'Unknown error')
      }
      
    } catch (error) {
      console.error('❌ Error downloading stock photos:', error)
      return {
        downloaded: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Saves a featured image to the unified media storage system
   */
  private async saveFeaturedImageToUnifiedStorage(
    featuredItem: any,
    userId: string,
    moodboardId: string
  ): Promise<any> {
    try {
      console.log(`💾 Saving featured image to unified storage: ${featuredItem.source}`)

      // Download the image from external URL
      const response = await fetch(featuredItem.url)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const imageBlob = new Blob([imageBuffer])
      const file = new File([imageBlob], `featured-${featuredItem.id}.jpg`, { type: 'image/jpeg' })

      // Determine source type
      let sourceType: 'upload' | 'playground' | 'enhanced' | 'stock' = 'upload'
      if (['pexels', 'unsplash', 'pixabay'].includes(featuredItem.source)) {
        sourceType = 'stock'
      } else if (featuredItem.source === 'ai-enhanced') {
        sourceType = 'enhanced'
      }

      // Upload to unified storage
      const result = await uploadUserImage(file, userId, {
        source_type: sourceType,
        metadata: {
          title: `Featured Image - ${featuredItem.source}`,
          description: featuredItem.caption || `Featured image from ${featuredItem.source}`,
          tags: ['featured', featuredItem.source, 'moodboard'],
          photographer: featuredItem.photographer,
          attribution: featuredItem.attribution,
          provider: featuredItem.source,
          photographer_url: featuredItem.photographer_url,
          width: featuredItem.width,
          height: featuredItem.height,
          original_url: featuredItem.url,
          featured_image: true,
          moodboard_id: moodboardId,
          original_item_id: featuredItem.id,
          saved_at: new Date().toISOString()
        }
      })

      if (result.success) {
        console.log('✅ Featured image saved to unified storage:', result.mediaId)
        return result
      } else {
        throw new Error(result.error || 'Failed to save to unified storage')
      }

    } catch (error) {
      console.error('❌ Error saving featured image to unified storage:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
