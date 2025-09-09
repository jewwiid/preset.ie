/**
 * Port interface for image storage operations
 */
export interface ImageStorageService {
  /**
   * Upload an image and return its URL
   */
  upload(file: Buffer | Blob, fileName: string, mimeType: string): Promise<string>;
  
  /**
   * Delete an image from storage
   */
  delete(url: string): Promise<void>;
  
  /**
   * Get a signed URL for temporary access
   */
  getSignedUrl(url: string, expiresIn: number): Promise<string>;
  
  /**
   * Download an image from a URL
   */
  download(url: string): Promise<Buffer>;
  
  /**
   * Check if a URL is accessible
   */
  isAccessible(url: string): Promise<boolean>;
}