import { supabase } from './supabase'

export interface ImageUploadResult {
  url: string
  path: string
  publicUrl: string
}

export interface ImageUploadOptions {
  bucket: string
  folder: string
  userId: string
  file: File
  maxSize?: number // in bytes
  allowedTypes?: string[]
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function uploadImage({
  bucket,
  folder,
  userId,
  file,
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES
}: ImageUploadOptions): Promise<ImageUploadResult> {
  // Validate file
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${folder}/${userId}/${fileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath,
    publicUrl
  }
}

export async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

// Specific upload functions for avatar and header
export async function uploadAvatar(userId: string, file: File): Promise<ImageUploadResult> {
  return uploadImage({
    bucket: 'user-media',
    folder: 'avatars',
    userId,
    file,
    maxSize: 2 * 1024 * 1024, // 2MB for avatars
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png']
  })
}

export async function uploadHeaderBanner(userId: string, file: File): Promise<ImageUploadResult> {
  return uploadImage({
    bucket: 'user-media',
    folder: 'headers',
    userId,
    file,
    maxSize: 5 * 1024 * 1024, // 5MB for headers
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  })
}

// Update profile with new image URLs
export async function updateProfileImages(
  userId: string,
  updates: {
    avatar_url?: string
    header_banner_url?: string
    header_banner_position?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('users_profile')
    .update(updates)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`)
  }
}
