import { NextRequest, NextResponse } from 'next/server'
import { FeaturedImageService } from '../../../../../packages/adapters/src/services/featured-image.service'

export async function POST(request: NextRequest) {
  try {
    const { 
      moodboardId, 
      userId, 
      featuredImageId 
    }: { 
      moodboardId: string
      userId: string
      featuredImageId?: string
    } = await request.json()
    
    if (!moodboardId || !userId) {
      return NextResponse.json(
        { error: 'Moodboard ID and User ID are required' },
        { status: 400 }
      )
    }
    
    const featuredImageService = new FeaturedImageService()
    
    // Download all stock photos in the moodboard
    const downloadResult = await featuredImageService.downloadAllStockPhotos(
      moodboardId,
      userId
    )
    
    let featuredImageResult = null
    
    // If there's a featured image, ensure it's downloaded
    if (featuredImageId) {
      featuredImageResult = await featuredImageService.ensureFeaturedImageDownloaded(
        moodboardId,
        featuredImageId,
        userId
      )
    }
    
    return NextResponse.json({
      success: true,
      stockPhotos: {
        downloaded: downloadResult.downloaded,
        failed: downloadResult.failed,
        errors: downloadResult.errors
      },
      featuredImage: featuredImageResult ? {
        success: featuredImageResult.success,
        url: featuredImageResult.featuredImageUrl,
        mediaId: featuredImageResult.mediaId,
        metadata: featuredImageResult.metadata
      } : null
    })
    
  } catch (error: any) {
    console.error('Moodboard download API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download moodboard images' },
      { status: 500 }
    )
  }
}
