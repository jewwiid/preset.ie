import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'pexels'

// Use environment variable for Pexels API key
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY'

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      page = 1, 
      per_page = 12, 
      orientation, 
      size, 
      color 
    } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }
    
    // Initialize Pexels client
    const client = createClient(PEXELS_API_KEY)
    
    // Build search parameters
    const searchParams: any = {
      query,
      page,
      per_page
    }
    
    // Add optional filters
    if (orientation) searchParams.orientation = orientation
    if (size) searchParams.size = size  
    if (color) searchParams.color = color
    
    // Search for photos
    const response = await client.photos.search(searchParams)
    
    if ('error' in response) {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }
    
    // Format the response
    const photos = response.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      src: photo.src,
      alt: photo.alt || '',
      width: photo.width,
      height: photo.height,
      avg_color: photo.avg_color || '#000000'
    }))
    
    return NextResponse.json({
      photos,
      page: response.page,
      per_page: response.per_page,
      total_results: response.total_results
    })
  } catch (error: any) {
    console.error('Pexels search error:', error)
    return NextResponse.json(
      { error: 'Failed to search photos' },
      { status: 500 }
    )
  }
}