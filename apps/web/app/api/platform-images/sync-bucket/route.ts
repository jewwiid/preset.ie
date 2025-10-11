import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper function to recursively list all files in bucket
    async function listAllFiles(path = ''): Promise<any[]> {
      const { data: items, error } = await supabase.storage
        .from('platform-images')
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(`Error listing path ${path}:`, error);
        return [];
      }

      if (!items || items.length === 0) return [];

      let allFiles: any[] = [];

      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;

        // If it's a folder, recursively list its contents
        if (item.id === null || item.metadata?.mimetype === 'application/x-directory') {
          const subFiles = await listAllFiles(fullPath);
          allFiles = allFiles.concat(subFiles);
        } else {
          // It's a file, add it with full path
          allFiles.push({ ...item, fullPath });
        }
      }

      return allFiles;
    }

    // List all files recursively
    const files = await listAllFiles();

    if (files.length === 0) {
      return NextResponse.json({ message: 'No files found in bucket', synced: 0 });
    }

    const syncedImages = [];
    let order = 1;

    // Create database records for each file
    for (const file of files) {
      // Skip if no valid path
      if (!file.fullPath) continue;

      // Get public URL using full path
      const { data: urlData } = supabase.storage
        .from('platform-images')
        .getPublicUrl(file.fullPath);

      const imageUrl = urlData.publicUrl;

      // Extract file info
      const fileName = file.fullPath.split('/').pop() || file.fullPath;
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      const extension = fileName.split('.').pop() || 'jpg';

      // Generate image key from full path (include folder structure)
      const imageKey = file.fullPath.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      // Role list for matching
      const ROLES = [
        'actors', 'models', 'singers', 'dancers', 'musicians',
        'photographers', 'videographers', 'cinematographers',
        'makeup-artists', 'hair-stylists', 'fashion-stylists',
        'directors', 'creative-directors', 'art-directors',
        'producers', 'editors', 'designers', 'writers',
        'freelancers', 'brand-managers', 'content-creators', 'studios'
      ];

      // Extract folder name and determine category
      const pathParts = file.fullPath.split('/');
      const folderName = pathParts.length > 1 ? pathParts[0] : null;
      const fileNameLower = fileName.toLowerCase().replace(/\.[^/.]+$/, '');

      // Determine image_type and category
      let imageType = 'general';
      let category = folderName;

      // Check if this is a role image
      const matchedRole = ROLES.find(role => {
        const roleNormalized = role.toLowerCase().replace(/-/g, '');
        const fileNormalized = fileNameLower.replace(/[-_\s]/g, '');
        return fileNormalized.includes(roleNormalized) || roleNormalized.includes(fileNormalized);
      });

      if (matchedRole) {
        imageType = 'role';
        category = `role-${matchedRole}`;
      } else if (folderName?.toLowerCase().includes('contributor') || folderName?.toLowerCase().includes('talent')) {
        // Check if filename matches a role
        const roleFromFilename = ROLES.find(role => fileNameLower.includes(role.replace('-', '')));
        if (roleFromFilename) {
          imageType = 'role';
          category = `role-${roleFromFilename}`;
        }
      }

      // Check if image already exists in database
      const { data: existing } = await supabase
        .from('platform_images')
        .select('id')
        .eq('image_key', imageKey)
        .single();

      if (existing) {
        console.log(`Image ${imageKey} already exists, skipping...`);
        continue;
      }

      // Create image record
      const { data: newImage, error: insertError } = await supabase
        .from('platform_images')
        .insert({
          image_key: imageKey,
          image_type: imageType,
          category: category,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          alt_text: fileNameWithoutExt.replace(/_/g, ' '),
          title: fileNameWithoutExt.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: `Platform image: ${fileNameWithoutExt.replace(/_/g, ' ')}`,
          width: 1920,
          height: 1080,
          file_size: file.metadata?.size || 0,
          format: extension,
          usage_context: {
            source: 'bucket_sync',
            bucket: 'platform-images',
            path: file.fullPath
          },
          is_active: true,
          display_order: order++
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Error inserting ${imageKey}:`, insertError);
        continue;
      }

      syncedImages.push(newImage);
      console.log(`✅ Synced: ${imageKey}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedImages.length} images`,
      synced: syncedImages.length,
      images: syncedImages
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync images' },
      { status: 500 }
    );
  }
}
