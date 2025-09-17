import { supabase } from './supabase'

/**
 * Upload a profile photo to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user's ID
 * @returns The public URL of the uploaded file
 */
export async function uploadProfilePhoto(file: File, userId: string): Promise<string | null> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Validate file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      throw new Error('File size must be less than 5MB')
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${userId}/profile_${Date.now()}.${fileExt}`

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return null
  }
}

/**
 * Delete a profile photo from Supabase Storage
 * @param photoUrl - The URL of the photo to delete
 * @param userId - The user's ID
 */
export async function deleteProfilePhoto(photoUrl: string, userId: string): Promise<boolean> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // Extract file path from URL
    const urlParts = photoUrl.split('/storage/v1/object/public/avatars/')
    if (urlParts.length !== 2) {
      throw new Error('Invalid photo URL')
    }

    const filePath = urlParts[1]

    // Ensure the file belongs to the user
    if (!filePath.startsWith(userId)) {
      throw new Error('Unauthorized')
    }

    // Delete from storage
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error deleting profile photo:', error)
    return false
  }
}

/**
 * Update user's profile photo
 * Handles uploading new photo and deleting old one
 * @param file - The new photo file
 * @param userId - The user's ID
 * @param oldPhotoUrl - The URL of the old photo to delete (optional)
 */
export async function updateProfilePhoto(
  file: File, 
  userId: string, 
  oldPhotoUrl?: string
): Promise<string | null> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // Upload new photo
    const newPhotoUrl = await uploadProfilePhoto(file, userId)
    
    if (!newPhotoUrl) {
      throw new Error('Failed to upload new photo')
    }

    // Delete old photo if it exists
    if (oldPhotoUrl && oldPhotoUrl.includes('avatars')) {
      await deleteProfilePhoto(oldPhotoUrl, userId)
    }

    // Update user profile with new photo URL
    const { error } = await supabase
      .from('users_profile')
      .update({ 
        avatar_url: newPhotoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Profile update error:', error)
      // Try to clean up uploaded photo
      await deleteProfilePhoto(newPhotoUrl, userId)
      throw error
    }

    return newPhotoUrl
  } catch (error) {
    console.error('Error updating profile photo:', error)
    return null
  }
}

/**
 * Convert a file to base64 data URL for preview
 * @param file - The file to convert
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default 1200px)
 * @param quality - JPEG quality (0-1, default 0.85)
 */
export async function compressImage(
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Calculate new dimensions
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'))
              return
            }
            
            const compressedFile = new File(
              [blob], 
              file.name, 
              { type: 'image/jpeg' }
            )
            
            // Only use compressed version if it's smaller
            if (compressedFile.size < file.size) {
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}