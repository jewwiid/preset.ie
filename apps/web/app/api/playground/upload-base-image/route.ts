import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const fileEntry = (formData as any).get('image') as File | null
    
    if (!fileEntry || typeof fileEntry === 'string') {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }
    
    const file = fileEntry

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/base-images/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Storage service unavailable' }, { status: 500 })
    }

    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('playground-uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('playground-uploads')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      imageUrl: publicUrl,
      fileName: fileName
    })

  } catch (error) {
    console.error('Upload base image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
