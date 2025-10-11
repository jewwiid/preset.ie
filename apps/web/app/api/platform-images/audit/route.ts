import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if auto-delete is requested
    const { searchParams } = new URL(request.url);
    const autoDelete = searchParams.get('autoDelete') === 'true';

    // Helper function to recursively list all files in bucket
    async function listAllFiles(path = ''): Promise<Set<string>> {
      const { data: items } = await supabase.storage
        .from('platform-images')
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!items || items.length === 0) return new Set();

      const allPaths = new Set<string>();

      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;

        // If it's a folder, recursively list its contents
        if (item.id === null || item.metadata?.mimetype === 'application/x-directory') {
          const subPaths = await listAllFiles(fullPath);
          subPaths.forEach(p => allPaths.add(p));
        } else {
          // It's a file
          allPaths.add(fullPath);
        }
      }

      return allPaths;
    }

    // Get all files from bucket
    const bucketFiles = await listAllFiles();
    console.log(`Found ${bucketFiles.size} files in bucket`);

    // Get all platform images from database
    const { data: dbImages, error: dbError } = await supabase
      .from('platform_images')
      .select('id, image_url, image_key, title, category');

    if (dbError) {
      console.error('Error fetching database images:', dbError);
      return NextResponse.json({ error: 'Failed to fetch database images' }, { status: 500 });
    }

    const brokenLinks: any[] = [];
    const validImages: any[] = [];

    // Check each database image
    for (const dbImage of dbImages || []) {
      try {
        // Extract path from URL
        const url = new URL(dbImage.image_url);
        const pathParts = url.pathname.split('/storage/v1/object/public/platform-images/');

        if (pathParts.length < 2) {
          brokenLinks.push({
            ...dbImage,
            reason: 'Invalid URL format'
          });
          continue;
        }

        const imagePath = decodeURIComponent(pathParts[1]);

        // Check if file exists in bucket
        if (!bucketFiles.has(imagePath)) {
          brokenLinks.push({
            ...dbImage,
            reason: 'File not found in bucket',
            expectedPath: imagePath
          });
        } else {
          validImages.push(dbImage);
        }
      } catch (err) {
        console.error('Error processing image:', dbImage.image_url, err);
        brokenLinks.push({
          ...dbImage,
          reason: 'Error processing URL'
        });
      }
    }

    console.log(`✅ Valid images: ${validImages.length}`);
    console.log(`❌ Broken links: ${brokenLinks.length}`);

    // Auto-delete broken links if requested
    let deletedCount = 0;
    if (autoDelete && brokenLinks.length > 0) {
      console.log('Auto-deleting broken image records...');
      const idsToDelete = brokenLinks.map(img => img.id);

      const { error: deleteError } = await supabase
        .from('platform_images')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting broken images:', deleteError);
      } else {
        deletedCount = idsToDelete.length;
        console.log(`✅ Deleted ${deletedCount} broken image records`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalInDatabase: dbImages?.length || 0,
        totalInBucket: bucketFiles.size,
        validImages: validImages.length,
        brokenLinks: brokenLinks.length,
        autoDeleted: deletedCount
      },
      brokenLinks: autoDelete ? [] : brokenLinks,
      validImages: validImages.map(img => ({ id: img.id, title: img.title, category: img.category }))
    });
  } catch (error) {
    console.error('Audit error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to audit images',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
