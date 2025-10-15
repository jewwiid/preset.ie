import { NextRequest, NextResponse } from 'next/server'

// Use environment variable for Pixabay API key
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || 'YOUR_PIXABAY_API_KEY'

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      page = 1, 
      per_page = 12, 
      orientation, 
      color,
      safesearch = true
    } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }
    
    // Build search parameters
    const searchParams = new URLSearchParams({
      key: PIXABAY_API_KEY,
      q: query,
      image_type: 'photo',
      page: page.toString(),
      per_page: per_page.toString(),
      safesearch: safesearch.toString()
    })
    
    // Add optional filters
    if (orientation && orientation !== 'all') {
      searchParams.append('orientation', orientation)
    }
    if (color) {
      searchParams.append('colors', color)
    }
    
    // Search for photos
    const response = await fetch(
      `https://pixabay.com/api/?${searchParams}`
    )
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Pixabay API error: ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Format the response
    const photos = data.hits?.map((photo: any) => ({
      id: photo.id.toString(),
      url: photo.largeImageURL || photo.webformatURL,
      photographer: photo.user,
      photographer_url: `https://pixabay.com/users/${photo.user.toLowerCase().replace(/\s+/g, '-')}-${photo.user_id}/`,
      src: {
        original: photo.imageURL,
        large2x: photo.fullHDURL || photo.largeImageURL,
        large: photo.largeImageURL || photo.webformatURL,
        medium: photo.webformatURL,
        small: photo.previewURL,
        portrait: photo.webformatURL,
        landscape: photo.webformatURL,
        tiny: photo.previewURL
      },
      alt: photo.tags || '',
      width: photo.imageWidth,
      height: photo.imageHeight,
      avg_color: '#000000', // Pixabay doesn't provide avg color
      provider: 'pixabay',
      attribution: `Image by ${photo.user} on Pixabay`
    })) || []
    
    return NextResponse.json({
      photos,
      page: page,
      per_page: per_page,
      total_results: data.totalHits || 0,
      total_pages: Math.ceil((data.totalHits || 0) / per_page)
    })
    
  } catch (error: any) {
    console.error('Pixabay search error:', error)
    return NextResponse.json(
      { error: 'Failed to search Pixabay photos' },
      { status: 500 }
    )
  }
}
