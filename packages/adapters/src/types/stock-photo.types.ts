// Stock photo types for the adapters package
export type StockPhotoProvider = 'pexels' | 'unsplash' | 'pixabay'

export interface StockPhoto {
  id: string
  url: string
  photographer: string
  photographer_url: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  alt: string
  width: number
  height: number
  avg_color: string
  provider: StockPhotoProvider
  attribution: string
}
