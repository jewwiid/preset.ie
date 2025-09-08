export interface StockPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  attribution: string;
  photographerUrl?: string;
  width: number;
  height: number;
  avgColor?: string;
}

export interface SearchOptions {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  count?: number;
  page?: number;
}

export interface StockPhotoService {
  searchPhotos(options: SearchOptions): Promise<StockPhoto[]>;
  getCuratedPhotos(count: number): Promise<StockPhoto[]>;
}

