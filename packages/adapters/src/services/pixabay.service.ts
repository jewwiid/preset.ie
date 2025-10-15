import { StockPhoto, StockPhotoProvider } from '../types/stock-photo.types'

export interface PixabayPhoto {
  id: number
  pageURL: string
  type: string
  tags: string
  previewURL: string
  previewWidth: number
  previewHeight: number
  webformatURL: string
  webformatWidth: number
  webformatHeight: number
  largeImageURL: string
  imageWidth: number
  imageHeight: number
  imageSize: number
  views: number
  downloads: number
  likes: number
  comments: number
  user_id: number
  user: string
  userImageURL: string
  imageURL?: string
  fullHDURL?: string
}

export interface StockPhotoFilters {
  query?: string
  orientation?: 'horizontal' | 'vertical' | 'all'
  size?: 'small' | 'medium' | 'large'
  color?: string
  page?: number
  per_page?: number
}

export interface PixabaySearchParams {
  query: string
  orientation?: 'horizontal' | 'vertical' | 'all'
  category?: string
  min_width?: number
  min_height?: number
  colors?: string
  safesearch?: boolean
  order?: 'popular' | 'latest'
  page?: number
  per_page?: number
}

export class PixabayService {
  private apiKey: string
  
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Pixabay API key is required')
    }
    this.apiKey = apiKey
  }
  
  async searchPhotos(params: PixabaySearchParams): Promise<StockPhoto[]> {
    try {
      const searchParams = new URLSearchParams({
        key: this.apiKey,
        q: params.query,
        image_type: 'photo',
        page: (params.page || 1).toString(),
        per_page: (params.per_page || 12).toString(),
        ...(params.orientation && params.orientation !== 'all' && { orientation: params.orientation }),
        ...(params.category && { category: params.category }),
        ...(params.min_width && { min_width: params.min_width.toString() }),
        ...(params.min_height && { min_height: params.min_height.toString() }),
        ...(params.colors && { colors: params.colors }),
        ...(params.safesearch !== undefined && { safesearch: params.safesearch.toString() }),
        ...(params.order && { order: params.order })
      })

      const response = await fetch(
        `https://pixabay.com/api/?${searchParams}`
      )

      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return data.hits?.map((photo: PixabayPhoto) => ({
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
        provider: 'pixabay' as const,
        attribution: `Image by ${photo.user} on Pixabay`
      })) || []

    } catch (error) {
      console.error('Error searching Pixabay photos:', error)
      throw error
    }
  }
}
