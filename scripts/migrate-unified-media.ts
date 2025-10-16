#!/usr/bin/env tsx

/**
 * Migration script to move existing media data to unified media table
 * Run this after applying the database schema migration
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface MigrationResult {
  success: boolean
  migrated: number
  failed: number
  errors: string[]
}

/**
 * Migrate playground_gallery entries to unified media table
 */
async function migratePlaygroundGallery(): Promise<MigrationResult> {
  console.log('🔄 Starting playground gallery migration...')

  const result: MigrationResult = {
    success: true,
    migrated: 0,
    failed: 0,
    errors: []
  }

  try {
    // Fetch all playground gallery items
    const { data: galleryItems, error: fetchError } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw new Error(`Failed to fetch playground gallery: ${fetchError.message}`)
    }

    console.log(`📊 Found ${galleryItems?.length || 0} playground gallery items`)

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

        // Determine if enhanced
        const isEnhanced = item.tags?.includes('ai-enhanced') ||
                          item.generation_metadata?.source === 'ai_enhancement'

        const mediaData = {
          owner_user_id: item.user_id,
          type: 'image',
          bucket: 'playground-images',
          path: item.image_url,
          url: item.image_url,
          width: item.width,
          height: item.height,
          blurhash: item.blurhash,
          palette: item.palette,
          visibility: (item.is_flagged || item.is_nsfw) ? 'private' : 'public',
          source_type: isEnhanced ? 'enhanced' : 'playground' as const,
          enhancement_type: isEnhanced ? item.generation_metadata?.style_applied : null,
          metadata: {
            ...item.generation_metadata,
            gallery_id: item.id,
            title: item.title,
            description: item.description,
            tags: item.tags,
            used_in_moodboard: item.used_in_moodboard,
            used_in_showcase: item.used_in_showcase,
            media_type: item.media_type,
            is_nsfw: item.is_nsfw,
            is_flagged: item.is_flagged,
            moderation_status: item.moderation_status,
            user_marked_nsfw: item.user_marked_nsfw,
            nsfw_confidence_score: item.nsfw_confidence_score,
            migrated_at: new Date().toISOString()
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
    result.success = false
    result.errors.push(`Playground migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Migrate user_media entries to unified media table
 */
async function migrateUserMedia(): Promise<MigrationResult> {
  console.log('🔄 Starting user media migration...')

  const result: MigrationResult = {
    success: true,
    migrated: 0,
    failed: 0,
    errors: []
  }

  try {
    // Fetch all user media items
    const { data: userMediaItems, error: fetchError } = await supabaseAdmin
      .from('user_media')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw new Error(`Failed to fetch user media: ${fetchError.message}`)
    }

    console.log(`📊 Found ${userMediaItems?.length || 0} user media items`)

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
        }

        const mediaData = {
          owner_user_id: item.user_id,
          type: item.mime_type?.startsWith('video/') ? 'video' : 'image',
          bucket: 'user-media',
          path: item.file_path,
          url: item.file_path,
          visibility: 'public', // User uploads are public by default
          source_type: sourceType,
          enhancement_type: enhancementType,
          metadata: {
            file_name: item.file_name,
            file_size: item.file_size,
            mime_type: item.mime_type,
            upload_purpose: item.upload_purpose,
            user_media_id: item.id,
            uploaded_at: item.created_at,
            ...item.metadata,
            migrated_at: new Date().toISOString()
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
    result.success = false
    result.errors.push(`User media migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Update moodboard items to reference media table IDs
 */
async function updateMoodboardReferences(): Promise<MigrationResult> {
  console.log('🔄 Updating moodboard references...')

  const result: MigrationResult = {
    success: true,
    migrated: 0,
    failed: 0,
    errors: []
  }

  try {
    // Fetch all moodboards with items
    const { data: moodboards, error: fetchError } = await supabaseAdmin
      .from('moodboards')
      .select('id, items')

    if (fetchError) {
      throw new Error(`Failed to fetch moodboards: ${fetchError.message}`)
    }

    console.log(`📊 Found ${moodboards?.length || 0} moodboards`)

    for (const moodboard of moodboards || []) {
      try {
        if (!moodboard.items || !Array.isArray(moodboard.items)) {
          continue
        }

        let updatedItems = false
        const updatedItemsArray = [...moodboard.items]

        // Update each moodboard item to reference unified media table
        for (let i = 0; i < updatedItemsArray.length; i++) {
          const item = updatedItemsArray[i]

          if (item.url || item.thumbnail_url) {
            // Find corresponding media entry
            const { data: mediaEntry } = await supabaseAdmin
              .from('media')
              .select('id')
              .or(`url.eq.${item.url},url.eq.${item.thumbnail_url}`)
              .single()

            if (mediaEntry) {
              updatedItemsArray[i] = {
                ...item,
                media_id: mediaEntry.id,
                unified_media_id: mediaEntry.id
              }
              updatedItems = true
            }
          }
        }

        if (updatedItems) {
          const { error: updateError } = await supabaseAdmin
            .from('moodboards')
            .update({ items: updatedItemsArray })
            .eq('id', moodboard.id)

          if (updateError) {
            throw new Error(`Failed to update moodboard: ${updateError.message}`)
          }

          result.migrated++
          console.log(`✅ Updated moodboard references: ${moodboard.id}`)
        }

      } catch (error) {
        result.failed++
        const errorMsg = `Failed to update moodboard ${moodboard.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Moodboard reference update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting unified media migration...')

  const startTime = Date.now()
  const totalResult: MigrationResult = {
    success: true,
    migrated: 0,
    failed: 0,
    errors: []
  }

  try {
    // Check if migration has already run
    const { data: existingMedia } = await supabaseAdmin
      .from('media')
      .select('id')
      .limit(1)

    if (!existingMedia || existingMedia.length === 0) {
      console.log('📋 Media table is empty, proceeding with migration...')
    } else {
      console.log(`⚠️  Media table has ${existingMedia.length}+ entries, checking for migration status...`)
    }

    // Run migrations in order
    console.log('\n=== Phase 1: Migrating Playground Gallery ===')
    const playgroundResult = await migratePlaygroundGallery()
    totalResult.migrated += playgroundResult.migrated
    totalResult.failed += playgroundResult.failed
    totalResult.errors.push(...playgroundResult.errors)

    console.log('\n=== Phase 2: Migrating User Media ===')
    const userMediaResult = await migrateUserMedia()
    totalResult.migrated += userMediaResult.migrated
    totalResult.failed += userMediaResult.failed
    totalResult.errors.push(...userMediaResult.errors)

    console.log('\n=== Phase 3: Updating Moodboard References ===')
    const moodboardResult = await updateMoodboardReferences()
    totalResult.migrated += moodboardResult.migrated
    totalResult.failed += moodboardResult.failed
    totalResult.errors.push(...moodboardResult.errors)

    const duration = Date.now() - startTime

    console.log('\n=== Migration Summary ===')
    console.log(`✅ Total migrated: ${totalResult.migrated}`)
    console.log(`❌ Total failed: ${totalResult.failed}`)
    console.log(`⏱️  Duration: ${duration}ms`)

    if (totalResult.errors.length > 0) {
      console.log('\n🚨 Errors encountered:')
      totalResult.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
      totalResult.success = false
    }

    if (totalResult.success) {
      console.log('\n🎉 Migration completed successfully!')
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the errors above.')
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    totalResult.success = false
    totalResult.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  process.exit(totalResult.success ? 0 : 1)
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration().catch(console.error)
}

export { runMigration, migratePlaygroundGallery, migrateUserMedia, updateMoodboardReferences }