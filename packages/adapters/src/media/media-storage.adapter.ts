import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MediaStorage } from '@preset/application';
import { Media, MediaId } from '@preset/domain';
import { Database } from '../database/database.types';
import * as ExifParser from 'exif-parser';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseMediaStorage implements MediaStorage {
  private readonly publicBucket = 'media-public';
  private readonly privateBucket = 'media-private';
  private readonly showcaseBucket = 'showcases';
  private readonly moodboardBucket = 'moodboards';
  private readonly releaseBucket = 'releases';

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async upload(
    file: Buffer | Blob,
    options: {
      bucket: 'public' | 'private' | 'showcase' | 'moodboard' | 'release';
      path: string;
      contentType: string;
      stripExif?: boolean;
      userId: string;
    }
  ): Promise<{ url: string; path: string; metadata: any }> {
    let processedFile = file;
    let metadata: any = {};

    // Strip EXIF data if requested and file is an image
    if (options.stripExif && options.contentType.startsWith('image/')) {
      const result = await this.stripExifData(file as Buffer);
      processedFile = result.buffer;
      metadata = result.metadata;
    }

    const bucketName = this.getBucketName(options.bucket);
    const fullPath = `${options.userId}/${options.path}`;

    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(fullPath, processedFile, {
        contentType: options.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(fullPath);

    return {
      url: urlData.publicUrl,
      path: fullPath,
      metadata,
    };
  }

  async download(path: string, bucket: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    const buffer = await data.arrayBuffer();
    return Buffer.from(buffer);
  }

  async delete(path: string, bucket: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async generateSignedUrl(
    path: string,
    bucket: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async getPublicUrl(path: string, bucket: string): Promise<string> {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async generateThumbnail(
    imageBuffer: Buffer,
    width: number = 400,
    height: number = 400
  ): Promise<Buffer> {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      throw new Error(`Failed to generate thumbnail: ${error}`);
    }
  }

  async extractImageMetadata(imageBuffer: Buffer): Promise<{
    width?: number;
    height?: number;
    format?: string;
    size: number;
    exif?: any;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      let exifData = null;
      if (metadata.exif) {
        try {
          const parser = ExifParser.create(imageBuffer);
          exifData = parser.parse();
        } catch (e) {
          // Ignore EXIF parsing errors
        }
      }

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: imageBuffer.length,
        exif: exifData,
      };
    } catch (error) {
      throw new Error(`Failed to extract metadata: ${error}`);
    }
  }

  async generateBlurhash(imageBuffer: Buffer): Promise<string> {
    try {
      // Resize image to small size for blurhash generation
      const resizedBuffer = await sharp(imageBuffer)
        .resize(32, 32, { fit: 'inside' })
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });

      // Import blurhash dynamically
      const { encode } = await import('blurhash');
      
      const blurhash = encode(
        new Uint8ClampedArray(resizedBuffer.data),
        resizedBuffer.info.width,
        resizedBuffer.info.height,
        4,
        4
      );

      return blurhash;
    } catch (error) {
      throw new Error(`Failed to generate blurhash: ${error}`);
    }
  }

  async extractColorPalette(
    imageBuffer: Buffer,
    maxColors: number = 5
  ): Promise<string[]> {
    try {
      const { dominant } = await sharp(imageBuffer).stats();
      
      // Get the dominant color
      const dominantColor = `#${dominant.r.toString(16).padStart(2, '0')}${dominant.g.toString(16).padStart(2, '0')}${dominant.b.toString(16).padStart(2, '0')}`;
      
      // For a more complete palette, we'd need a proper color extraction library
      // For now, return variations of the dominant color
      const palette = [dominantColor];
      
      // Generate variations (lighter and darker)
      for (let i = 1; i < maxColors && i < 5; i++) {
        const factor = 1 + (i * 0.2);
        const r = Math.min(255, Math.floor(dominant.r * factor));
        const g = Math.min(255, Math.floor(dominant.g * factor));
        const b = Math.min(255, Math.floor(dominant.b * factor));
        palette.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      }

      return palette;
    } catch (error) {
      throw new Error(`Failed to extract color palette: ${error}`);
    }
  }

  private async stripExifData(imageBuffer: Buffer): Promise<{
    buffer: Buffer;
    metadata: any;
  }> {
    try {
      // Extract metadata before stripping
      const metadata = await this.extractImageMetadata(imageBuffer);
      
      // Strip EXIF data (including GPS)
      const strippedBuffer = await sharp(imageBuffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .removeMetadata() // Remove all metadata including EXIF
        .toBuffer();

      return {
        buffer: strippedBuffer,
        metadata: {
          ...metadata,
          exifStripped: true,
          originalExif: metadata.exif,
        },
      };
    } catch (error) {
      throw new Error(`Failed to strip EXIF data: ${error}`);
    }
  }

  private getBucketName(bucket: string): string {
    switch (bucket) {
      case 'public':
        return this.publicBucket;
      case 'private':
        return this.privateBucket;
      case 'showcase':
        return this.showcaseBucket;
      case 'moodboard':
        return this.moodboardBucket;
      case 'release':
        return this.releaseBucket;
      default:
        throw new Error(`Invalid bucket type: ${bucket}`);
    }
  }

  async createBucketsIfNotExist(): Promise<void> {
    const buckets = [
      { name: this.publicBucket, public: true },
      { name: this.privateBucket, public: false },
      { name: this.showcaseBucket, public: true },
      { name: this.moodboardBucket, public: true },
      { name: this.releaseBucket, public: false },
    ];

    for (const bucket of buckets) {
      const { error } = await this.supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'video/mp4',
          'video/quicktime',
          'application/pdf',
        ],
      });

      // Ignore error if bucket already exists
      if (error && !error.message.includes('already exists')) {
        console.error(`Failed to create bucket ${bucket.name}:`, error);
      }
    }
  }

  async moveFile(
    fromPath: string,
    toPath: string,
    fromBucket: string,
    toBucket: string
  ): Promise<void> {
    // Download from source
    const file = await this.download(fromPath, fromBucket);
    
    // Upload to destination
    await this.supabase.storage
      .from(toBucket)
      .upload(toPath, file, {
        upsert: false,
      });
    
    // Delete from source
    await this.delete(fromPath, fromBucket);
  }

  async copyFile(
    fromPath: string,
    toPath: string,
    fromBucket: string,
    toBucket: string
  ): Promise<void> {
    // Download from source
    const file = await this.download(fromPath, fromBucket);
    
    // Upload to destination
    await this.supabase.storage
      .from(toBucket)
      .upload(toPath, file, {
        upsert: false,
      });
  }
}