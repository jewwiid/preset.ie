import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Utility functions for accessing featured images across all codebases
 * These functions work with the existing user_media table structure
 */

export interface FeaturedImageInfo {
  url: string
  photographer?: string
  photographer_url?: string
  attribution?: string
  provider?: string
  permanentlyStored: boolean
}

/**
 * Gets the featured image URL for a moodboard
 * This is the main function used across all codebases
 */
export async function getFeaturedImageUrl(moodboardId: string): Promise<string | null> {
  try {
    const { data: moodboard, error } = await supabase
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
 * Gets featured image with full metadata for attribution
 */
export async function getFeaturedImageInfo(moodboardId: string): Promise<FeaturedImageInfo | null> {
  try {
    const { data: moodboard, error } = await supabase
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
      url: featuredItem.url || featuredItem.thumbnail_url || '',
      photographer: featuredItem.photographer,
      photographer_url: featuredItem.photographer_url,
      attribution: featuredItem.attribution,
      provider: featuredItem.source,
      permanentlyStored: featuredItem.permanentlyStored || false
    }
    
  } catch (error) {
    console.error('Error getting featured image info:', error)
    return null
  }
}

/**
 * Gets all images from a moodboard (for galleries, etc.)
 */
export async function getMoodboardImages(moodboardId: string): Promise<FeaturedImageInfo[]> {
  try {
    const { data: moodboard, error } = await supabase
      .from('moodboards')
      .select('items')
      .eq('id', moodboardId)
      .single()
    
    if (error || !moodboard || !moodboard.items) {
      return []
    }
    
    return moodboard.items
      .filter((item: any) => item.type === 'image' || item.url)
      .map((item: any) => ({
        url: item.url || item.thumbnail_url || '',
        photographer: item.photographer,
        photographer_url: item.photographer_url,
        attribution: item.attribution,
        provider: item.source,
        permanentlyStored: item.permanentlyStored || false
      }))
    
  } catch (error) {
    console.error('Error getting moodboard images:', error)
    return []
  }
}

/**
 * Checks if a moodboard has a featured image
 */
export async function hasFeaturedImage(moodboardId: string): Promise<boolean> {
  const url = await getFeaturedImageUrl(moodboardId)
  return url !== null
}

/**
 * Gets featured image for multiple moodboards (for lists, cards, etc.)
 */
export async function getMultipleFeaturedImages(moodboardIds: string[]): Promise<Record<string, string | null>> {
  try {
    const { data: moodboards, error } = await supabase
      .from('moodboards')
      .select('id, featured_image_id, items')
      .in('id', moodboardIds)
    
    if (error || !moodboards) {
      return {}
    }
    
    const result: Record<string, string | null> = {}
    
    moodboards.forEach((moodboard: any) => {
      if (!moodboard.featured_image_id || !moodboard.items) {
        result[moodboard.id] = null
        return
      }
      
      const featuredItem = moodboard.items.find((item: any) => 
        item.id === moodboard.featured_image_id
      )
      
      result[moodboard.id] = featuredItem?.url || featuredItem?.thumbnail_url || null
    })
    
    return result
    
  } catch (error) {
    console.error('Error getting multiple featured images:', error)
    return {}
  }
}

/**
 * Gets user's downloaded stock photos from user_media table
 */
export async function getUserStockPhotos(userId: string, provider?: string): Promise<any[]> {
  try {
    let query = supabase
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
 * Checks if an image URL is from our storage (permanently stored)
 */
export function isPermanentlyStored(url: string): boolean {
  if (!url) return false
  
  const supabaseDomain = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '')
  if (!supabaseDomain) return false
  
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes(supabaseDomain)
  } catch {
    return false
  }
}

/**
 * Gets attribution text for display
 */
export function getAttributionText(imageInfo: FeaturedImageInfo): string {
  if (!imageInfo.photographer) return ''
  
  const provider = imageInfo.provider || 'Unknown'
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
  
  return `Photo by ${imageInfo.photographer} on ${providerName}`
}
