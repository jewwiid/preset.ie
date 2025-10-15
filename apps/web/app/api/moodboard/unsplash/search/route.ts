import { NextRequest, NextResponse } from 'next/server'

// Use environment variable for Unsplash API key
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY'

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      page = 1, 
      per_page = 12, 
      orientation, 
      color 
    } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }
    
    
    // Build search parameters
    const searchParams = new URLSearchParams({
      query,
      page: page.toString(),
      per_page: per_page.toString()
    })
    
    // Add optional filters
    if (orientation) searchParams.append('orientation', orientation)
    if (color) searchParams.append('color', color)
    
    // Search for photos
    const response = await fetch(
      `https://api.unsplash.com/search/photos?${searchParams}`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1'
        }
      }
    )
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Unsplash API error: ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Format the response
    const photos = data.results?.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.full,
      photographer: photo.user.name,
      photographer_url: photo.user.links.html,
      src: {
        original: photo.urls.raw,
        large2x: photo.urls.full,
        large: photo.urls.regular,
        medium: photo.urls.small,
        small: photo.urls.thumb,
        portrait: photo.urls.regular,
        landscape: photo.urls.regular,
        tiny: photo.urls.thumb
      },
      alt: photo.alt_description || photo.description || '',
      width: photo.width,
      height: photo.height,
      avg_color: photo.color || '#000000',
      provider: 'unsplash',
      attribution: `Photo by ${photo.user.name} on Unsplash`
    })) || []
    
    return NextResponse.json({
      photos,
      page: page,
      per_page: per_page,
      total_results: data.total || 0,
      total_pages: Math.ceil((data.total || 0) / per_page)
    })
    
  } catch (error: any) {
    console.error('Unsplash search error:', error)
    return NextResponse.json(
      { error: 'Failed to search Unsplash photos' },
      { status: 500 }
    )
  }
}
