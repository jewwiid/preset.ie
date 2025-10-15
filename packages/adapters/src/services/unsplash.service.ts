import { StockPhoto, StockPhotoProvider } from '../types/stock-photo.types'

export interface UnsplashPhoto {
  id: string
  slug: string
  created_at: string
  updated_at: string
  promoted_at?: string
  width: number
  height: number
  color: string
  blur_hash: string
  description?: string
  alt_description?: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
    small_s3: string
  }
  links: {
    self: string
    html: string
    download: string
    download_location: string
  }
  likes: number
  liked_by_user: boolean
  current_user_collections: any[]
  sponsorship?: any
  topic_submissions: any
  user: {
    id: string
    username: string
    name: string
    first_name: string
    last_name: string
    twitter_username?: string
    portfolio_url?: string
    bio?: string
    location?: string
    links: {
      self: string
      html: string
      photos: string
      likes: string
      portfolio: string
      following: string
      followers: string
    }
    profile_image: {
      small: string
      medium: string
      large: string
    }
    instagram_username?: string
    total_collections: number
    total_likes: number
    total_photos: number
    accepted_tos: boolean
    for_hire: boolean
    social: {
      instagram_username?: string
      portfolio_url?: string
      twitter_username?: string
      paypal_email?: any
    }
  }
}

export interface UnsplashStockPhotoFilters {
  query?: string
  orientation?: 'landscape' | 'portrait' | 'square'
  size?: 'small' | 'medium' | 'large'
  color?: string
  page?: number
  per_page?: number
}

export interface UnsplashSearchParams {
  query: string
  orientation?: 'landscape' | 'portrait' | 'square'
  color?: string
  page?: number
  per_page?: number
}

export class UnsplashService {
  private accessKey: string
  
  constructor(accessKey: string) {
    if (!accessKey) {
      throw new Error('Unsplash access key is required')
    }
    this.accessKey = accessKey
  }
  
  async searchPhotos(params: UnsplashSearchParams): Promise<StockPhoto[]> {
    try {
      const searchParams = new URLSearchParams({
        query: params.query,
        page: (params.page || 1).toString(),
        per_page: (params.per_page || 12).toString(),
        ...(params.orientation && { orientation: params.orientation }),
        ...(params.color && { color: params.color })
      })

      const response = await fetch(
        `https://api.unsplash.com/search/photos?${searchParams}`,
        {
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
            'Accept-Version': 'v1'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return data.results?.map((photo: UnsplashPhoto) => ({
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
        provider: 'unsplash' as const,
        attribution: `Photo by ${photo.user.name} on Unsplash`
      })) || []

    } catch (error) {
      console.error('Error searching Unsplash photos:', error)
      throw error
    }
  }
}
