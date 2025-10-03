import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { getUserFromRequest } from '../../../../../lib/auth-utils'

// Manually load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (from project root)
dotenv.config({ path: path.join(process.cwd(), '../../.env.local') })

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getUserFromRequest(request)
  
  if (!user) {
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
    const { id: imageId } = await params

    // First, get the gallery item to find the storage path
    const { data: galleryItem, error: fetchError } = await supabaseAdmin
      .from('playground_gallery')
      .select('image_url, video_url, media_type, generation_metadata')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching gallery item:', fetchError)
      throw fetchError
    }

    if (!galleryItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Extract the storage path from the URL or metadata
    const storageUrl = galleryItem.video_url || galleryItem.image_url
    const storagePath = galleryItem.generation_metadata?.storage_path

    // Delete from Supabase Storage if it's stored there
    if (storagePath) {
      const bucketName = galleryItem.media_type === 'video' ? 'playground-videos' : 'playground-images'

      console.log(`🗑️ Deleting file from storage: ${bucketName}/${storagePath}`)

      const { error: storageError } = await supabaseAdmin.storage
        .from(bucketName)
        .remove([storagePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue with database deletion even if storage delete fails
      } else {
        console.log('✅ File deleted from storage successfully')
      }
    } else if (storageUrl && storageUrl.includes('supabase')) {
      // Try to extract path from Supabase URL as fallback
      console.warn('⚠️ No storage_path in metadata, attempting to extract from URL')
      // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const urlParts = storageUrl.split('/storage/v1/object/public/')
      if (urlParts.length > 1) {
        const [bucket, ...pathParts] = urlParts[1].split('/')
        const path = pathParts.join('/')

        const { error: storageError } = await supabaseAdmin.storage
          .from(bucket)
          .remove([path])

        if (storageError) {
          console.error('Storage delete error (from URL):', storageError)
        }
      }
    }

    // Delete the record from the database
    const { error: deleteError } = await supabaseAdmin
      .from('playground_gallery')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Gallery delete error:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: galleryItem.media_type === 'video' ? 'Video deleted successfully' : 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete image:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete image'
    }, { status: 500 })
  }
}
