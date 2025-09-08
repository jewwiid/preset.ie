import { createClient, Photo, ErrorResponse } from 'pexels';
import { StockPhotoService, StockPhoto, SearchOptions } from '../../domain/moodboards/ports/StockPhotoService';

export class PexelsService implements StockPhotoService {
  private readonly client: any;

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('Pexels API key is required');
    }
    this.client = createClient(apiKey);
  }

  async searchPhotos(options: SearchOptions): Promise<StockPhoto[]> {
    try {
      const response = await this.client.photos.search({
        query: options.query,
        orientation: options.orientation,
        size: 'large',
        per_page: options.count || 6,
        page: options.page || 1
      });

      if ('error' in response) {
        throw new Error((response as ErrorResponse).error);
      }

      return response.photos.map((photo: Photo) => ({
        id: `pexels_${photo.id}`,
        url: photo.src.large2x,
        thumbnailUrl: photo.src.medium,
        attribution: `Photo by ${photo.photographer} on Pexels`,
        photographerUrl: photo.photographer_url,
        width: photo.width,
        height: photo.height,
        avgColor: photo.avg_color
      }));
    } catch (error) {
      console.error('Error searching Pexels photos:', error);
      throw error;
    }
  }

  async getCuratedPhotos(count: number = 6): Promise<StockPhoto[]> {
    try {
      const response = await this.client.photos.curated({
        per_page: count,
        page: 1
      });

      if ('error' in response) {
        throw new Error((response as ErrorResponse).error);
      }

      return response.photos.map((photo: Photo) => ({
        id: `pexels_${photo.id}`,
        url: photo.src.large2x,
        thumbnailUrl: photo.src.medium,
        attribution: `Photo by ${photo.photographer} on Pexels`,
        photographerUrl: photo.photographer_url,
        width: photo.width,
        height: photo.height,
        avgColor: photo.avg_color
      }));
    } catch (error) {
      console.error('Error getting curated Pexels photos:', error);
      throw error;
    }
  }
}

