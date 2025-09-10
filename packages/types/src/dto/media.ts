import { MediaType } from '../database/enums';

export interface MediaDTO {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  metadata: MediaMetadataDTO;
  visibility: 'public' | 'private';
  tags?: string[];
  createdAt: Date;
}

export interface MediaMetadataDTO {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  size: number;
  blurhash?: string;
  palette?: string[];
  exifStripped: boolean;
}

export interface MediaUploadDTO {
  file: File | Blob;
  type: MediaType;
  gigId?: string;
  showcaseId?: string;
  visibility?: 'public' | 'private';
  stripExif?: boolean;
  generateBlurhash?: boolean;
  extractPalette?: boolean;
}

export interface MediaUploadResponseDTO {
  id: string;
  url: string;
  signedUrl?: string;
  thumbnailUrl?: string;
  metadata: MediaMetadataDTO;
  uploadedAt: Date;
}

export interface SignedUrlDTO {
  url: string;
  expiresAt: Date;
  method: 'GET' | 'PUT';
}

export interface MediaProcessingOptionsDTO {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
  };
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  stripExif?: boolean;
  generateBlurhash?: boolean;
  extractPalette?: boolean;
  generateThumbnail?: boolean;
}