import { NextRequest, NextResponse } from 'next/server'
import { StockPhotoDownloaderService } from '../../../../../packages/adapters/src/services/stock-photo-downloader.service'
import { StockPhoto } from '../../../components/moodboard/lib/moodboardTypes'

export async function POST(request: NextRequest) {
  try {
    const { 
      stockPhotos, 
      userId, 
      purpose = 'moodboard' 
    }: { 
      stockPhotos: StockPhoto[]
      userId: string
      purpose?: 'moodboard' | 'featured' | 'gallery'
    } = await request.json()
    
    if (!stockPhotos || !Array.isArray(stockPhotos) || stockPhotos.length === 0) {
      return NextResponse.json(
        { error: 'Stock photos array is required' },
        { status: 400 }
      )
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const downloaderService = new StockPhotoDownloaderService()
    
    // Download all stock photos
    const results = await downloaderService.downloadAndSaveStockPhotos(
      stockPhotos,
      userId,
      purpose
    )
    
    // Separate successful and failed downloads
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`✅ Downloaded ${successful.length}/${stockPhotos.length} stock photos`)
    if (failed.length > 0) {
      console.warn(`⚠️ Failed to download ${failed.length} stock photos:`, failed.map(f => f.error))
    }
    
    return NextResponse.json({
      success: true,
      downloaded: successful.length,
      failed: failed.length,
      results: successful.map(r => ({
        originalId: stockPhotos.find(p => p.id === r.metadata?.fileName.split('-')[1])?.id,
        mediaId: r.mediaId,
        permanentUrl: r.permanentUrl,
        provider: r.metadata?.provider,
        photographer: r.metadata?.photographer,
        attribution: r.metadata?.attribution
      })),
      errors: failed.map(f => f.error)
    })
    
  } catch (error: any) {
    console.error('Stock photo download API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download stock photos' },
      { status: 500 }
    )
  }
}
