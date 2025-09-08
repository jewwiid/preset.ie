export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  mimeType: string;
  size: number;
  palette?: string[];
  blurhash?: string;
}

export interface UploadResult {
  id: string;
  url: string;
  bucket: string;
  path: string;
  metadata: MediaMetadata;
}

export interface MediaStorage {
  uploadImage(file: Buffer | Blob, userId: string, gigId?: string): Promise<UploadResult>;
  uploadVideo(file: Buffer | Blob, userId: string, gigId?: string): Promise<UploadResult>;
  uploadPdf(file: Buffer | Blob, userId: string, gigId?: string): Promise<UploadResult>;
  getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;
  getPublicUrl(bucket: string, path: string): string;
  delete(bucket: string, path: string): Promise<void>;
  stripExifData(imageBuffer: Buffer): Promise<Buffer>;
}