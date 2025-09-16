import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  console.log('Save-to-gallery API called')
  
  const { user, error: authError } = await getUserFromRequest(request)
  console.log('Auth result:', { user: user?.id, authError })
  
  const { imageUrl, title, description, tags, projectId, editId, overrideExisting, generationMetadata } = await request.json()
  console.log('Request data:', { imageUrl, title, description, tags, projectId, editId, overrideExisting, generationMetadata })
  
  if (!user) {
    console.log('No user found, returning 401')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  try {
    let finalImageUrl = imageUrl
    
    // Handle data URLs by uploading to Supabase Storage
    if (imageUrl.startsWith('data:image/')) {
      console.log('Processing data URL image')
      
      // Extract the base64 data
      const base64Data = imageUrl.split(',')[1]
      const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0]
      const fileExtension = mimeType.split('/')[1]
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileName = `cropped-image-${timestamp}-${randomId}.${fileExtension}`
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('playground-gallery')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false
        })
      
      if (uploadError) {
        console.error('Error uploading image to storage:', uploadError)
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }
      
      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('playground-gallery')
        .getPublicUrl(fileName)
      
      finalImageUrl = urlData.publicUrl
      console.log('Successfully uploaded image to storage:', finalImageUrl)
    }
    
    // Check if image already exists in user's gallery
    const { data: existingImage, error: checkError } = await supabaseAdmin
      .from('playground_gallery')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .eq('image_url', finalImageUrl)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking for existing image:', checkError)
      throw checkError
    }
    
    if (existingImage && !overrideExisting) {
      console.log('Image already exists in gallery:', existingImage)
      return NextResponse.json({
        success: false,
        error: 'duplicate',
        message: 'This media is already saved in your gallery',
        existingImage: {
          id: existingImage.id,
          title: existingImage.title,
          created_at: existingImage.created_at
        }
      }, { status: 409 }) // Conflict status
    }
    
    // If image exists and override is requested, update it
    if (existingImage && overrideExisting) {
      console.log('Updating existing image:', existingImage.id)
      
      const { data: updatedImage, error: updateError } = await supabaseAdmin
        .from('playground_gallery')
        .update({
          title: title || existingImage.title,
          description,
          tags: tags || [],
          generation_metadata: generationMetadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existingImage.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating existing image:', updateError)
        throw updateError
      }
      
      console.log('Successfully updated existing image:', updatedImage)
      
      return NextResponse.json({ 
        success: true, 
        galleryItem: updatedImage,
        action: 'updated'
      })
    }
    
    // Extract image dimensions
    let imageWidth = 1024 // Default fallback
    let imageHeight = 1024 // Default fallback
    
    try {
      // Try to extract dimensions from generation metadata first
      if (generationMetadata?.resolution) {
        const resolutionMatch = generationMetadata.resolution.match(/(\d+)x(\d+)/)
        if (resolutionMatch) {
          imageWidth = parseInt(resolutionMatch[1])
          imageHeight = parseInt(resolutionMatch[2])
          console.log('Extracted dimensions from metadata:', { imageWidth, imageHeight })
        }
      }
      
      // If metadata doesn't have resolution, try to get it from the image URL
      if (imageWidth === 1024 && imageHeight === 1024) {
        // For Seedream URLs, we can sometimes extract dimensions from the URL
        // or we could make a HEAD request to get image dimensions
        // For now, we'll use the metadata if available
        if (generationMetadata?.aspect_ratio) {
          const aspectRatio = generationMetadata.aspect_ratio
          if (aspectRatio === '16:9') {
            imageWidth = 1920
            imageHeight = 1080
          } else if (aspectRatio === '9:16') {
            imageWidth = 1080
            imageHeight = 1920
          } else if (aspectRatio === '21:9') {
            imageWidth = 2560
            imageHeight = 1080
          } else if (aspectRatio === '4:3') {
            imageWidth = 1024
            imageHeight = 768
          } else if (aspectRatio === '3:4') {
            imageWidth = 768
            imageHeight = 1024
          }
          console.log('Extracted dimensions from aspect ratio:', { imageWidth, imageHeight, aspectRatio })
        }
      }
    } catch (error) {
      console.error('Error extracting image dimensions:', error)
      // Keep default values
    }
    
    console.log('Attempting to insert into playground_gallery table')
    
    // Save to gallery
    const { data: galleryItem, error: insertError } = await supabaseAdmin
      .from('playground_gallery')
      .insert({
        user_id: user.id,
        project_id: projectId,
        edit_id: editId,
        image_url: finalImageUrl,
        thumbnail_url: finalImageUrl, // Use final URL as thumbnail for now
        title: title || 'Untitled',
        description,
        tags: tags || [],
        width: imageWidth,
        height: imageHeight,
        file_size: 0, // Unknown size for external URLs
        format: 'jpg',
        generation_metadata: generationMetadata || {}
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Gallery insert error:', insertError)
      throw insertError
    }
    
    console.log('Successfully saved to gallery:', galleryItem)
    
    return NextResponse.json({ 
      success: true, 
      galleryItem,
      action: 'created'
    })
  } catch (error) {
    console.error('Failed to save to gallery:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save to gallery',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
