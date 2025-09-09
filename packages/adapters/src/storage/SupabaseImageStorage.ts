import { SupabaseClient } from '@supabase/supabase-js';
import { ImageStorageService } from '@preset/domain/moodboards/ports/ImageStorageService';

export class SupabaseImageStorage implements ImageStorageService {
  private bucketName = 'moodboard-images';

  constructor(private supabase: SupabaseClient) {}

  async upload(file: Buffer | Blob, fileName: string, mimeType: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async delete(url: string): Promise<void> {
    // Extract file path from URL
    const fileName = this.extractFileName(url);
    
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([fileName]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  async getSignedUrl(url: string, expiresIn: number): Promise<string> {
    const fileName = this.extractFileName(url);
    
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(fileName, expiresIn);

    if (error || !data) {
      throw new Error(`Failed to create signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  async download(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  async isAccessible(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  private extractFileName(url: string): string {
    // Extract file name from Supabase storage URL
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (match) {
      return match[1];
    }
    
    // Try to extract from regular URL
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  }
}