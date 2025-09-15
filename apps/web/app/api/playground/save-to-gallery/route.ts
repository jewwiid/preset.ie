import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { imageUrl, title, description, tags, projectId, editId } = await request.json()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  try {
    // Get image metadata
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    
    // Upload to Supabase storage
    const fileName = `${user.id}/${crypto.randomUUID()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('playground-gallery')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      })
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('playground-gallery')
      .getPublicUrl(fileName)
    
    // Save to gallery
    const { data: galleryItem } = await supabase
      .from('playground_gallery')
      .insert({
        user_id: user.id,
        project_id: projectId,
        edit_id: editId,
        image_url: publicUrl,
        thumbnail_url: publicUrl, // Could generate thumbnail
        title: title || 'Untitled',
        description,
        tags: tags || [],
        width: 1024, // Default, could extract from image
        height: 1024,
        file_size: imageBlob.size,
        format: 'jpg'
      })
      .select()
      .single()
    
    return NextResponse.json({ 
      success: true, 
      galleryItem 
    })
  } catch (error) {
    console.error('Failed to save to gallery:', error)
    return NextResponse.json({ error: 'Failed to save to gallery' }, { status: 500 })
  }
}
