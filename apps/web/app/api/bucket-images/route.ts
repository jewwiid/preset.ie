import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // For now, allow any authenticated user to access bucket images
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // List all files in the platform-images bucket
    const { data: files, error } = await supabaseAdmin.storage
      .from('platform-images')
      .list('public', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing bucket files:', error);
      return NextResponse.json({ error: 'Failed to list bucket files' }, { status: 500 });
    }

    // Get public URLs for all files
    const imagesWithUrls = files.map(file => {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('platform-images')
        .getPublicUrl(`public/${file.name}`);
      
      return {
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at,
        publicUrl: publicUrlData.publicUrl,
        metadata: file.metadata
      };
    });

    return NextResponse.json({ images: imagesWithUrls }, { status: 200 });
  } catch (error) {
    console.error('Error in bucket images API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
