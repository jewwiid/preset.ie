import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Moves an image from temporary storage to permanent saved folder
 * Structure:
 * - Temporary: playground-gallery/{user-id}/temporary/images/{filename}
 * - Saved: playground-gallery/{user-id}/saved/images/{filename}
 *
 * @param imageUrl - The URL of the image to move
 * @param userId - The user's ID
 * @returns The new permanent URL, or original URL if not in temporary storage
 */
export async function moveImageToPermanentStorage(imageUrl: string, userId: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Check if this is a temporary image URL
  if (!imageUrl.includes('/temporary/images/')) {
    console.log('Image not in temporary storage, keeping original URL:', imageUrl)
    return imageUrl
  }

  try {
    // Extract the file path from the URL
    // URL format: https://{domain}/storage/v1/object/public/playground-gallery/{user-id}/temporary/images/{filename}
    const urlParts = imageUrl.split('/playground-gallery/')
    if (urlParts.length < 2) {
      console.log('Could not parse image URL, keeping original:', imageUrl)
      return imageUrl
    }

    const oldPath = urlParts[1] // e.g., {user-id}/temporary/images/upload-123.jpg
    const filename = oldPath.split('/').pop() // e.g., upload-123.jpg

    if (!filename) {
      console.log('Could not extract filename, keeping original URL')
      return imageUrl
    }

    // Create new path in saved folder
    const newPath = `${userId}/saved/images/${filename}`

    console.log('Moving image from temporary to permanent storage:', { oldPath, newPath })

    // Copy the file to the new location
    const { data: copyData, error: copyError } = await supabase.storage
      .from('playground-gallery')
      .copy(oldPath, newPath)

    if (copyError) {
      console.error('Failed to copy image to permanent storage:', copyError)
      return imageUrl // Return original URL on error
    }

    console.log('Successfully copied image to permanent storage')

    // Get the new public URL
    const { data: urlData } = supabase.storage
      .from('playground-gallery')
      .getPublicUrl(newPath)

    // Delete the temporary file
    const { error: deleteError } = await supabase.storage
      .from('playground-gallery')
      .remove([oldPath])

    if (deleteError) {
      console.warn('Failed to delete temporary image (not critical):', deleteError)
    } else {
      console.log('Successfully deleted temporary image')
    }

    return urlData.publicUrl
  } catch (error) {
    console.error('Error moving image to permanent storage:', error)
    return imageUrl // Return original URL on error
  }
}

/**
 * Moves a video from temporary storage to permanent saved folder
 * Structure:
 * - Temporary: playground-gallery/{user-id}/temporary/videos/{filename}
 * - Saved: playground-gallery/{user-id}/saved/videos/{filename}
 *
 * @param videoUrl - The URL of the video to move
 * @param userId - The user's ID
 * @returns The new permanent URL, or original URL if not in temporary storage
 */
export async function moveVideoToPermanentStorage(videoUrl: string, userId: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Check if this is a temporary video URL
  if (!videoUrl.includes('/temporary/videos/')) {
    console.log('Video not in temporary storage, keeping original URL:', videoUrl)
    return videoUrl
  }

  try {
    // Extract the file path from the URL
    const urlParts = videoUrl.split('/playground-gallery/')
    if (urlParts.length < 2) {
      console.log('Could not parse video URL, keeping original:', videoUrl)
      return videoUrl
    }

    const oldPath = urlParts[1] // e.g., {user-id}/temporary/videos/video-123.mp4
    const filename = oldPath.split('/').pop() // e.g., video-123.mp4

    if (!filename) {
      console.log('Could not extract filename, keeping original URL')
      return videoUrl
    }

    // Create new path in saved folder
    const newPath = `${userId}/saved/videos/${filename}`

    console.log('Moving video from temporary to permanent storage:', { oldPath, newPath })

    // Copy the file to the new location
    const { data: copyData, error: copyError } = await supabase.storage
      .from('playground-gallery')
      .copy(oldPath, newPath)

    if (copyError) {
      console.error('Failed to copy video to permanent storage:', copyError)
      return videoUrl // Return original URL on error
    }

    console.log('Successfully copied video to permanent storage')

    // Get the new public URL
    const { data: urlData } = supabase.storage
      .from('playground-gallery')
      .getPublicUrl(newPath)

    // Delete the temporary file
    const { error: deleteError } = await supabase.storage
      .from('playground-gallery')
      .remove([oldPath])

    if (deleteError) {
      console.warn('Failed to delete temporary video (not critical):', deleteError)
    } else {
      console.log('Successfully deleted temporary video')
    }

    return urlData.publicUrl
  } catch (error) {
    console.error('Error moving video to permanent storage:', error)
    return videoUrl // Return original URL on error
  }
}
