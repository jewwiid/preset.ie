import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  console.log('Save-to-gallery API called')
  
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Create two clients: one for user auth, one for admin operations
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Set the user's session to verify the token
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { imageUrl, title, description, tags, projectId, editId, overrideExisting, generationMetadata } = await request.json()
    console.log('Request data:', { imageUrl, title, description, tags, projectId, editId, overrideExisting, generationMetadata })
    let finalImageUrl = imageUrl
    
    // Handle data URLs and external URLs by uploading to Supabase Storage
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
    } else if (imageUrl.startsWith('http')) {
      // Handle external URLs (like Seedream URLs) by downloading and storing them
      console.log('Processing external URL image:', imageUrl)
      
      try {
        // Download the image from the external URL
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
        }
        
        const imageBuffer = await response.arrayBuffer()
        let contentType = response.headers.get('content-type') || 'image/jpeg'
        
        // Fix common content-type issues
        if (contentType === 'binary/octet-stream' || contentType === 'application/octet-stream') {
          // Try to detect from URL
          if (imageUrl.includes('.png')) {
            contentType = 'image/png'
          } else if (imageUrl.includes('.webp')) {
            contentType = 'image/webp'
          } else if (imageUrl.includes('.gif')) {
            contentType = 'image/gif'
          } else {
            contentType = 'image/jpeg' // Default to JPEG
          }
        }
        
        const fileExtension = contentType.split('/')[1] || 'jpg'
        
        // Generate unique filename
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 15)
        const fileName = `saved-image-${timestamp}-${randomId}.${fileExtension}`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('playground-gallery')
          .upload(fileName, imageBuffer, {
            contentType: contentType,
            upsert: false
          })
        
        if (uploadError) {
          console.error('Error uploading external image to storage:', uploadError)
          throw new Error(`Failed to upload external image: ${uploadError.message}`)
        }
        
        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('playground-gallery')
          .getPublicUrl(fileName)
        
        finalImageUrl = urlData.publicUrl
        console.log('Successfully downloaded and uploaded external image to storage:', finalImageUrl)
        
      } catch (downloadError) {
        console.error('Error downloading external image:', downloadError)
        // If download fails, store the original URL but warn about expiration
        console.warn('Failed to download external image, storing original URL (may expire)')
        finalImageUrl = imageUrl
      }
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
      // Priority 1: Use actual dimensions from metadata if available
      if (generationMetadata?.actual_width && generationMetadata?.actual_height) {
        imageWidth = generationMetadata.actual_width
        imageHeight = generationMetadata.actual_height
        console.log('Using actual dimensions from metadata:', { imageWidth, imageHeight })
      }
      // Priority 2: Extract from resolution string
      else if (generationMetadata?.resolution) {
        const resolutionMatch = generationMetadata.resolution.match(/(\d+)[\*x](\d+)/)
        if (resolutionMatch) {
          imageWidth = parseInt(resolutionMatch[1])
          imageHeight = parseInt(resolutionMatch[2])
          console.log('Extracted dimensions from resolution string:', { imageWidth, imageHeight, resolution: generationMetadata.resolution })
        }
      }
      // Priority 3: Calculate from aspect ratio and base resolution
      else if (generationMetadata?.aspect_ratio) {
        const aspectRatio = generationMetadata.aspect_ratio
        
        // Handle custom aspect ratios like "1024:576"
        const aspectMatch = aspectRatio.match(/(\d+):(\d+)/)
        if (aspectMatch) {
          const widthRatio = parseInt(aspectMatch[1])
          const heightRatio = parseInt(aspectMatch[2])
          const ratio = widthRatio / heightRatio
          
          // Use the base resolution to calculate actual dimensions
          const baseResolution = parseInt(generationMetadata.resolution?.split(/[\*x]/)[0] || '1024')
          
          if (ratio >= 1) {
            imageWidth = baseResolution
            imageHeight = Math.round(baseResolution / ratio)
          } else {
            imageHeight = baseResolution
            imageWidth = Math.round(baseResolution * ratio)
          }
          
          console.log('Calculated dimensions from custom aspect ratio:', { 
            imageWidth, imageHeight, aspectRatio, ratio, baseResolution 
          })
        }
        // Handle standard aspect ratios
        else if (aspectRatio === '16:9') {
          imageWidth = 1920; imageHeight = 1080
        } else if (aspectRatio === '9:16') {
          imageWidth = 1080; imageHeight = 1920
        } else if (aspectRatio === '21:9') {
          imageWidth = 2560; imageHeight = 1080
        } else if (aspectRatio === '4:3') {
          imageWidth = 1024; imageHeight = 768
        } else if (aspectRatio === '3:4') {
          imageWidth = 768; imageHeight = 1024
        }
        
        console.log('Extracted dimensions from aspect ratio:', { imageWidth, imageHeight, aspectRatio })
      }
    } catch (error) {
      console.error('Error extracting image dimensions:', error)
      // Keep default values
    }
    
    console.log('Attempting to insert into playground_gallery table')
    
    // Save to gallery
    const insertData = {
      user_id: user.id,
      image_url: finalImageUrl,
      thumbnail_url: finalImageUrl, // Use final URL as thumbnail for now
      title: title || 'Untitled',
      description: description || null,
      tags: tags || [],
      width: imageWidth,
      height: imageHeight,
      file_size: 0, // Unknown size for external URLs
      format: 'jpg', // Will be updated below if we have file extension info
      generation_metadata: {
        ...generationMetadata,
        original_url: imageUrl, // Store original URL for reference
        permanently_stored: finalImageUrl !== imageUrl, // Track if image was downloaded and stored
        storage_method: imageUrl.startsWith('data:') ? 'base64' : 
                      imageUrl.startsWith('http') ? 'downloaded' : 'external_reference',
        // Ensure custom dimensions are preserved
        saved_width: imageWidth,
        saved_height: imageHeight,
        saved_aspect_ratio: generationMetadata?.aspect_ratio || `${imageWidth}:${imageHeight}`,
        saved_at: new Date().toISOString()
      }
    }

    // Only add optional fields if they exist and are valid
    if (projectId && projectId !== 'null' && projectId !== 'undefined') {
      (insertData as any).project_id = projectId
    }
    if (editId && editId !== 'null' && editId !== 'undefined') {
      (insertData as any).edit_id = editId
    }

    // Update format based on image URL or content type
    if (finalImageUrl.includes('.png')) {
      insertData.format = 'png'
    } else if (finalImageUrl.includes('.webp')) {
      insertData.format = 'webp'
    } else if (finalImageUrl.includes('.gif')) {
      insertData.format = 'gif'
    } else if (finalImageUrl.includes('.jpeg') || finalImageUrl.includes('.jpg')) {
      insertData.format = 'jpg'
    }

    console.log('Inserting data:', insertData)

    const { data: galleryItem, error: insertError } = await supabaseAdmin
      .from('playground_gallery')
      .insert(insertData)
      .select()
      .single()

    // Also create a media entry with cinematic metadata
    if (galleryItem && !insertError) {
      try {
        // Get user's profile ID
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !userProfile) {
          console.error('Error fetching user profile for media creation:', profileError);
          throw new Error('User profile not found');
        }

        const cinematicMetadata = generationMetadata?.cinematic_parameters || {}
        
        const { data: mediaItem, error: mediaError } = await supabaseAdmin
          .from('media')
          .insert({
            owner_user_id: userProfile.id,
            type: 'IMAGE',
            bucket: 'playground-gallery',
            path: finalImageUrl,
            width: imageWidth,
            height: imageHeight,
            ai_metadata: {
              ...cinematicMetadata,
              generation_metadata: generationMetadata,
              enhanced_prompt: generationMetadata?.enhanced_prompt,
              include_technical_details: generationMetadata?.include_technical_details,
              include_style_references: generationMetadata?.include_style_references,
              // Preserve all generation settings for reuse
              original_prompt: generationMetadata?.prompt,
              style: generationMetadata?.style,
              aspect_ratio: generationMetadata?.aspect_ratio,
              resolution: generationMetadata?.resolution,
              consistency_level: generationMetadata?.consistency_level,
              generation_mode: generationMetadata?.generation_mode,
              base_image: generationMetadata?.base_image,
              provider: generationMetadata?.provider,
              intensity: generationMetadata?.intensity,
              // Preserve actual dimensions
              actual_width: imageWidth,
              actual_height: imageHeight,
              saved_at: new Date().toISOString()
            }
          })
          .select()
          .single()

        if (mediaError) {
          console.error('Error creating media entry:', mediaError)
          // Don't fail the whole operation if media creation fails
        } else {
          console.log('Successfully created media entry with cinematic metadata:', mediaItem)
        }
      } catch (mediaError) {
        console.error('Error creating media entry:', mediaError)
        // Don't fail the whole operation if media creation fails
      }
    }
    
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
