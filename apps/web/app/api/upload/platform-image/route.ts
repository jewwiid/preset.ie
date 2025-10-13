import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = (formData as any).get('file') as File | null;
    const imageType = ((formData as any).get('image_type') as string) || 'general';
    const category = ((formData as any).get('category') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Determine folder structure based on image_type and category
    let folderPath = '';
    
    if (imageType === 'hero' || category === 'hero') {
      folderPath = 'page-headers/hero';
    } else if (imageType === 'role' || category?.startsWith('role-')) {
      folderPath = 'roles';
    } else if (imageType === 'talent-for-hire' || category === 'talent-for-hire') {
      folderPath = 'page-headers/talent-for-hire';
    } else if (imageType === 'contributors' || category === 'contributors') {
      folderPath = 'page-headers/contributors';
    } else if (imageType === 'creative-roles' || category === 'creative-roles') {
      folderPath = 'page-headers/creative-roles';
    } else if (category) {
      folderPath = category.replace(/\s+/g, '-').toLowerCase();
    } else {
      folderPath = 'general';
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folderPath}/platform-image-${timestamp}-${randomString}.${fileExtension}`;

    console.log('📁 Uploading to folder:', folderPath);
    console.log('📄 Full path:', fileName);

    // Upload to Supabase Storage with folder structure
    const { data, error } = await supabase.storage
      .from('platform-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('platform-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      fileName,
      filePath: data.path,
      publicUrl: urlData.publicUrl,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}