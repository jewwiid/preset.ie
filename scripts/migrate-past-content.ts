#!/usr/bin/env tsx

/**
 * Migration script for past generated content
 * Migrates existing playground_gallery and user_media entries to unified media table
 * Run this after applying the unified_media_storage_safe.sql migration
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌ Missing')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌ Missing')
  console.error('\n💡 Make sure your .env.local file contains the required Supabase credentials.')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface MigrationResult {
  success: boolean
  migrated: number
  failed: number
  errors: string[]
  details: {
    playgroundGallery: { existing: number; migrated: number; failed: number }
    userMedia: { existing: number; migrated: number; failed: number }
    enhancedImages: { migrated: number }
  }
}

/**
 * Migrate playground_gallery entries to unified media table
 */
async function migratePlaygroundGallery(): Promise<{ existing: number; migrated: number; failed: number; errors: string[] }> {
  console.log('🔄 Starting playground gallery migration...')

  const result = { existing: 0, migrated: 0, failed: 0, errors: [] as string[] }

  try {
    // Get all playground gallery items
    const { data: galleryItems, error: fetchError } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw new Error(`Failed to fetch playground gallery: ${fetchError.message}`)
    }

    result.existing = galleryItems?.length || 0
    console.log(`📊 Found ${result.existing} playground gallery items`)

    for (const item of galleryItems || []) {
      try {
        // Check if already migrated
        const { data: existingMedia } = await supabaseAdmin
          .from('media')
          .select('id')
          .eq('url', item.image_url)
          .eq('source_type', 'playground')
          .single()

        if (existingMedia) {
          console.log(`⏭️  Skipping already migrated item: ${item.id}`)
          continue
        }

        // Determine if this is an enhanced image
        const isEnhanced = item.tags?.includes('ai-enhanced') ||
                          item.generation_metadata?.source === 'ai_enhancement' ||
                          item.generation_metadata?.enhancement_type

        const mediaData = {
          owner_user_id: item.user_id,
          type: 'image',
          bucket: 'playground-images',
          path: item.image_url,
          url: item.image_url, // This should work with the existing schema
          width: item.width,
          height: item.height,
          blurhash: item.blurhash,
          palette: item.generation_metadata?.palette || item.palette,
          visibility: (item.is_flagged || item.is_nsfw) ? 'private' : 'public',
          source_type: isEnhanced ? 'enhanced' : 'playground' as const,
          enhancement_type: isEnhanced ? item.generation_metadata?.style_applied || item.generation_metadata?.enhancement_type : null,
          original_media_id: null,
          metadata: {
            ...item.generation_metadata,
            gallery_id: item.id,
            title: item.title || 'Generated Image',
            description: item.description || '',
            tags: item.tags || [],
            used_in_moodboard: item.used_in_moodboard || false,
            used_in_showcase: item.used_in_showcase || false,
            media_type: item.media_type || 'image',
            is_nsfw: item.is_nsfw || false,
            is_flagged: item.is_flagged || false,
            moderation_status: item.moderation_status || 'pending',
            user_marked_nsfw: item.user_marked_nsfw || false,
            nsfw_confidence_score: item.nsfw_confidence_score || 0.0,
            original_created_at: item.created_at,
            migrated_at: new Date().toISOString(),
            migration_source: 'playground_gallery'
          }
        }

        const { error: insertError } = await supabaseAdmin
          .from('media')
          .insert(mediaData)

        if (insertError) {
          throw new Error(`Failed to insert media: ${insertError.message}`)
        }

        result.migrated++
        console.log(`✅ Migrated playground item: ${item.id}`)

      } catch (error) {
        result.failed++
        const errorMsg = `Failed to migrate playground item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

  } catch (error) {
    result.errors.push(`Playground migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Migrate user_media entries to unified media table
 */
async function migrateUserMedia(): Promise<{ existing: number; migrated: number; failed: number; errors: string[] }> {
  console.log('🔄 Starting user media migration...')

  const result = { existing: 0, migrated: 0, failed: 0, errors: [] as string[] }

  try {
    // Get all user media items
    const { data: userMediaItems, error: fetchError } = await supabaseAdmin
      .from('user_media')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw new Error(`Failed to fetch user media: ${fetchError.message}`)
    }

    result.existing = userMediaItems?.length || 0
    console.log(`📊 Found ${result.existing} user media items`)

    for (const item of userMediaItems || []) {
      try {
        // Check if already migrated
        const { data: existingMedia } = await supabaseAdmin
          .from('media')
          .select('id')
          .eq('url', item.file_path)
          .eq('source_type', 'upload')
          .single()

        if (existingMedia) {
          console.log(`⏭️  Skipping already migrated user media: ${item.id}`)
          continue
        }

        // Determine source type and enhancement type
        let sourceType: 'upload' | 'enhanced' | 'stock' = 'upload'
        let enhancementType = null

        if (item.upload_purpose === 'enhanced_image') {
          sourceType = 'enhanced'
          enhancementType = item.metadata?.enhancement_type || 'unknown'
        } else if (item.upload_purpose === 'stock_photo') {
          sourceType = 'stock'
        } else if (item.upload_purpose === 'featured_image') {
          sourceType = 'stock'
        }

        const mediaData = {
          owner_user_id: item.user_id,
          type: item.mime_type?.startsWith('video/') ? 'video' : 'image',
          bucket: 'user-media',
          path: item.file_path,
          url: item.file_path, // Use file_path as url
          width: item.metadata?.width,
          height: item.metadata?.height,
          duration: item.metadata?.duration,
          visibility: 'public',
          source_type: sourceType,
          enhancement_type: enhancementType,
          original_media_id: null,
          metadata: {
            file_name: item.file_name,
            file_size: item.file_size,
            mime_type: item.mime_type,
            upload_purpose: item.upload_purpose,
            user_media_id: item.id,
            uploaded_at: item.created_at,
            migrated_at: new Date().toISOString(),
            migration_source: 'user_media',
            ...item.metadata
          }
        }

        const { error: insertError } = await supabaseAdmin
          .from('media')
          .insert(mediaData)

        if (insertError) {
          throw new Error(`Failed to insert media: ${insertError.message}`)
        }

        result.migrated++
        console.log(`✅ Migrated user media: ${item.id}`)

      } catch (error) {
        result.failed++
        const errorMsg = `Failed to migrate user media ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

  } catch (error) {
    result.errors.push(`User media migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Count enhanced images that have been migrated
 */
async function countMigratedEnhancedImages(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('media')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'enhanced')

    if (error) {
      console.warn('Could not count enhanced images:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.warn('Error counting enhanced images:', error)
    return 0
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting past content migration...')
  console.log('=' .repeat(50))

  const startTime = Date.now()
  const result: MigrationResult = {
    success: true,
    migrated: 0,
    failed: 0,
    errors: [],
    details: {
      playgroundGallery: { existing: 0, migrated: 0, failed: 0 },
      userMedia: { existing: 0, migrated: 0, failed: 0 },
      enhancedImages: { migrated: 0 }
    }
  }

  try {
    // Phase 1: Migrate playground gallery
    console.log('\n=== Phase 1: Migrating Playground Gallery ===')
    const playgroundResult = await migratePlaygroundGallery()
    result.details.playgroundGallery = playgroundResult
    result.migrated += playgroundResult.migrated
    result.failed += playgroundResult.failed
    result.errors.push(...playgroundResult.errors)

    // Phase 2: Migrate user media
    console.log('\n=== Phase 2: Migrating User Media ===')
    const userMediaResult = await migrateUserMedia()
    result.details.userMedia = userMediaResult
    result.migrated += userMediaResult.migrated
    result.failed += userMediaResult.failed
    result.errors.push(...userMediaResult.errors)

    // Phase 3: Count enhanced images
    console.log('\n=== Phase 3: Counting Enhanced Images ===')
    const enhancedCount = await countMigratedEnhancedImages()
    result.details.enhancedImages.migrated = enhancedCount

    const duration = Date.now() - startTime

    console.log('\n' + '='.repeat(50))
    console.log('📊 Migration Summary:')
    console.log(`✅ Total migrated: ${result.migrated}`)
    console.log(`❌ Total failed: ${result.failed}`)
    console.log(`⏱️  Duration: ${duration}ms`)

    console.log('\n📈 Detailed Results:')
    console.log(`🎨 Playground Gallery:`)
    console.log(`   Existing: ${result.details.playgroundGallery.existing}`)
    console.log(`   Migrated: ${result.details.playgroundGallery.migrated}`)
    console.log(`   Failed: ${result.details.playgroundGallery.failed}`)

    console.log(`📁 User Media:`)
    console.log(`   Existing: ${result.details.userMedia.existing}`)
    console.log(`   Migrated: ${result.details.userMedia.migrated}`)
    console.log(`   Failed: ${result.details.userMedia.failed}`)

    console.log(`✨ Enhanced Images:`)
    console.log(`   Migrated: ${result.details.enhancedImages.migrated}`)

    if (result.errors.length > 0) {
      console.log('\n🚨 Errors encountered:')
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
      result.success = false
    }

    console.log('\n🎉 Migration completed!')

    if (result.success) {
      console.log('\n✅ All past content has been successfully migrated to the unified media system!')
      console.log('📝 You can now see all your past generated content in the media dashboard.')
      console.log('🔗 Visit: http://localhost:3000/dashboard/media')
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check the details above.')
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    result.success = false
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration().catch(console.error)
}

export { runMigration, migratePlaygroundGallery, migrateUserMedia, countMigratedEnhancedImages }