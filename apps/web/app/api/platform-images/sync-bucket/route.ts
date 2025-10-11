import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // List all files in the platform-images bucket
    const { data: files, error: listError } = await supabase.storage
      .from('platform-images')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing bucket files:', listError);
      return NextResponse.json({ error: 'Failed to list bucket files' }, { status: 500 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'No files found in bucket', synced: 0 });
    }

    const syncedImages = [];
    let order = 1;

    // Create database records for each file
    for (const file of files) {
      // Skip folders
      if (!file.name || file.name.endsWith('/')) continue;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('platform-images')
        .getPublicUrl(file.name);

      const imageUrl = urlData.publicUrl;

      // Extract file info
      const fileName = file.name.split('/').pop() || file.name;
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      const extension = fileName.split('.').pop() || 'jpg';

      // Generate image key from filename
      const imageKey = fileNameWithoutExt.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      // Determine category based on filename
      let category = 'general';
      if (fileName.includes('hero')) category = 'hero';
      if (fileName.includes('portrait')) category = 'portrait';
      if (fileName.includes('studio')) category = 'studio';
      if (fileName.includes('model')) category = 'model';
      if (fileName.includes('lifestyle')) category = 'lifestyle';
      if (fileName.includes('logo')) category = 'logo';

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
          image_type: 'homepage',
          category: category,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          alt_text: fileNameWithoutExt.replace(/_/g, ' '),
          title: fileNameWithoutExt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `Platform image: ${fileNameWithoutExt.replace(/_/g, ' ')}`,
          width: 1920,
          height: 1080,
          file_size: file.metadata?.size || 0,
          format: extension,
          usage_context: {
            source: 'bucket_sync',
            bucket: 'platform-images',
            path: file.name
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
