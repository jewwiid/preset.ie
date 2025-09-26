import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images').filter((file) => file instanceof File) as File[];
    const listingId = (formData as any).get('listingId') || '';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Validate files
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 5MB.` },
          { status: 400 }
        );
      }

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has an unsupported format.` },
          { status: 400 }
        );
      }
    }

    // Upload files to Supabase Storage
    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${listingId}/${Date.now()}-${i}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('listings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload ${file.name}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('listings')
        .getPublicUrl(fileName);

      uploadedImages.push({
        path: uploadData.path,
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        sort_order: i
      });
    }

    // Save image metadata to database
    const imageRecords = uploadedImages.map(img => ({
      listing_id: listingId,
      path: img.path,
      url: img.url,
      alt_text: img.name,
      sort_order: img.sort_order,
      file_size: img.size,
      mime_type: img.type
    }));

    console.log('Attempting to insert image records:', imageRecords);
    
    // Use service role to bypass RLS for image metadata insertion
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: dbError } = await serviceSupabase
      .from('listing_images')
      .insert(imageRecords);

    if (dbError) {
      console.error('Database error:', dbError);
      console.error('Image records that failed:', imageRecords);
      return NextResponse.json(
        { error: `Failed to save image metadata: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
