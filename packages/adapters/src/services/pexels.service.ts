import { createClient, Photo, Video, ErrorResponse } from 'pexels';

export interface PexelsImage {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
  width: number;
  height: number;
  avg_color: string;
}

export interface PexelsVideo {
  id: number;
  url: string;
  user: {
    name: string;
    url: string;
  };
  video_files: Array<{
    link: string;
    quality: string;
    width: number;
    height: number;
  }>;
  video_pictures: Array<{
    picture: string;
  }>;
  duration: number;
  width: number;
  height: number;
}

export interface PexelsSearchParams {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  color?: string;
  locale?: string;
  page?: number;
  per_page?: number;
}

export class PexelsService {
  private client: any;
  
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Pexels API key is required');
    }
    this.client = createClient(apiKey);
  }
  
  async searchPhotos(params: PexelsSearchParams): Promise<PexelsImage[]> {
    try {
      const response = await this.client.photos.search({
        query: params.query,
        orientation: params.orientation,
        size: params.size,
        color: params.color,
        locale: params.locale || 'en-US',
        page: params.page || 1,
        per_page: params.per_page || 12
      });
      
      if ('error' in response) {
        throw new Error((response as ErrorResponse).error);
      }
      
      return response.photos.map((photo: Photo) => ({
        id: photo.id,
        url: photo.url,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        src: photo.src,
        alt: photo.alt || '',
        width: photo.width,
        height: photo.height,
        avg_color: photo.avg_color || '#000000'
      }));
    } catch (error) {
      console.error('Error searching Pexels photos:', error);
      throw error;
    }
  }
  
  async searchVideos(params: PexelsSearchParams): Promise<PexelsVideo[]> {
    try {
      const response = await this.client.videos.search({
        query: params.query,
        orientation: params.orientation,
        size: params.size,
        locale: params.locale || 'en-US',
        page: params.page || 1,
        per_page: params.per_page || 12
      });
      
      if ('error' in response) {
        throw new Error((response as ErrorResponse).error);
      }
      
      return response.videos.map((video: Video) => ({
        id: video.id,
        url: video.url,
        user: video.user,
        video_files: video.video_files,
        video_pictures: video.video_pictures,
        duration: video.duration,
        width: video.width,
        height: video.height
      }));
    } catch (error) {
      console.error('Error searching Pexels videos:', error);
      throw error;
    }
  }
  
  async getCuratedPhotos(page: number = 1, perPage: number = 12): Promise<PexelsImage[]> {
    try {
      const response = await this.client.photos.curated({
        page,
        per_page: perPage
      });
      
      if ('error' in response) {
        throw new Error((response as ErrorResponse).error);
      }
      
      return response.photos.map((photo: Photo) => ({
        id: photo.id,
        url: photo.url,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        src: photo.src,
        alt: photo.alt || '',
        width: photo.width,
        height: photo.height,
        avg_color: photo.avg_color || '#000000'
      }));
    } catch (error) {
      console.error('Error fetching curated photos:', error);
      throw error;
    }
  }
  
  async getPhotoById(id: number): Promise<PexelsImage | null> {
    try {
      const photo = await this.client.photos.show({ id });
      
      if ('error' in photo) {
        throw new Error((photo as ErrorResponse).error);
      }
      
      return {
        id: photo.id,
        url: photo.url,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        src: photo.src,
        alt: photo.alt || '',
        width: photo.width,
        height: photo.height,
        avg_color: photo.avg_color || '#000000'
      };
    } catch (error) {
      console.error('Error fetching photo by ID:', error);
      return null;
    }
  }
}