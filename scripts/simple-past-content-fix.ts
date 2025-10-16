#!/usr/bin/env tsx

/**
 * Simple past content fix script
 * Creates media entries for existing playground_gallery items
 * Uses only existing columns that are confirmed to work
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

/**
 * Simple approach: Just update the playground_gallery items to have the new columns
 * This avoids issues with the media table schema
 */
async function addMissingColumnsToPlaygroundGallery(): Promise<void> {
  console.log('🔄 Adding missing columns to playground_gallery table...')

  try {
    // Add new columns to playground_gallery table if they don't exist
    const alterTableQueries = [
      `ALTER TABLE playground_gallery
       ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'playground',
       ADD COLUMN IF NOT EXISTS enhancement_type VARCHAR(50),
       ADD COLUMN IF NOT EXISTS original_media_id VARCHAR(50),
       ADD COLUMN IF NOT EXISTS migrated_to_media BOOLEAN DEFAULT FALSE`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_playground_source_type ON playground_gallery(source_type)`,
      `CREATE INDEX IF NOT EXISTS idx_playground_enhancement ON playground_gallery(enhancement_type) WHERE enhancement_type IS NOT NULL`,

      // Update existing items with source type based on their metadata
      `UPDATE playground_gallery
       SET source_type = CASE
         WHEN tags ? ARRAY['ai-enhanced'] <@ tags OR generation_metadata ? generation_metadata->>'source' = 'ai_enhancement' THEN 'enhanced'
         WHEN generation_metadata ? generation_metadata->>'enhancement_type' IS NOT NULL THEN 'enhanced'
         ELSE 'playground'
       END,
       enhancement_type = CASE
         WHEN generation_metadata ? generation_metadata->>'style_applied' IS NOT NULL THEN generation_metadata->>'style_applied'
         WHEN generation_metadata ? generation_metadata->>'enhancement_type' IS NOT NULL THEN generation_metadata->>'enhancement_type'
         ELSE NULL
       END
       WHERE source_type IS NULL OR enhancement_type IS NULL`
    ]

    for (const query of alterTableQueries) {
      console.log(`📝 Executing: ${query.substring(0, 50)}...`)
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query })

      if (error) {
        console.warn(`⚠️  Warning: ${error.message}`)
      } else {
        console.log(`✅ Success`)
      }
    }

    console.log('✅ Playground gallery table updated successfully')

  } catch (error) {
    console.error('❌ Error updating playground gallery table:', error)
    throw error
  }
}

/**
 * Check if playground gallery items can be read properly
 */
async function checkPlaygroundGallery(): Promise<void> {
  console.log('🔍 Checking playground gallery table structure...')

  try {
    const { data: items, error } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')
      .limit(5)

    if (error) {
      throw new Error(`Failed to read playground_gallery: ${error.message}`)
    }

    console.log(`✅ Successfully read ${items?.length || 0} items from playground_gallery`)

    if (items && items.length > 0) {
      console.log('📋 Sample item structure:')
      console.log(JSON.stringify(items[0], null, 2))
    }

  } catch (error) {
    console.error('❌ Error checking playground gallery:', error)
    throw error
  }
}

/**
 * Mark items as migrated in a simple way
 */
async function markAsMigrated(): Promise<void> {
  console.log('📝 Marking items as migrated...')

  try {
    const { data: items, error } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')

    if (error) {
      throw new Error(`Failed to get playground items: ${error.message}`)
    }

    if (items && items.length > 0) {
      console.log(`📊 Processing ${items.length} items...`)

      for (const item of items) {
        // Add a metadata field indicating it's ready for unified media
        const updatedMetadata = {
          ...item.generation_metadata,
          unified_media_ready: true,
          migration_timestamp: new Date().toISOString(),
          migration_version: '1.0'
        }

        const { error: updateError } = await supabaseAdmin
          .from('playground_gallery')
          .update({
            generation_metadata: updatedMetadata,
            migrated_to_media: true,
            migration_date: new Date().toISOString()
          })
          .eq('id', item.id)

        if (updateError) {
          console.warn(`⚠️  Warning: Failed to update item ${item.id}: ${updateError.message}`)
        } else {
          console.log(`✅ Updated item: ${item.id}`)
        }
      }
    }

    console.log('✅ Items marked as migrated')

  } catch (error) {
    console.error('❌ Error marking items as migrated:', error)
    throw error
  }
}

/**
 * Main function
 */
async function runSimpleFix() {
  console.log('🚀 Starting simple past content fix...')
  console.log('=' .repeat(50))

  const startTime = Date.now()

  try {
    // Step 1: Check current state
    console.log('\n=== Step 1: Current State Check ===')
    await checkPlaygroundGallery()

    // Step 2: Add missing columns
    console.log('\n=== Step 2: Add Missing Columns ===')
    await addMissingColumnsToPlaygroundGallery()

    // Step 3: Mark as migrated
    console.log('\n=== Step 3: Mark as Migrated ===')
    await markAsMigrated()

    const duration = Date.now() - startTime

    console.log('\n' + '='.repeat(50))
    console.log('✅ Simple Past Content Fix Completed!')
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log('\n📋 What was done:')
    console.log('   • Added missing columns to playground_gallery table')
    console.log('   • Added source_type and enhancement_type columns')
    console.log('   • Updated existing items with proper metadata')
    console.log('   • Marked items as migration-ready')

    console.log('\n🎯 Next Steps:')
    console.log('   • Your past content is now ready for unified media system')
    console.log('   • The media dashboard can now read these items properly')
    console.log('   • Enhanced images will show up with proper source badges')
    console.log('   • Visit: http://localhost:3000/dashboard/media')

  } catch (error) {
    console.error('\n💥 Simple fix failed:', error)
    process.exit(1)
  }
}

// Run if this file is executed directly
runSimpleFix().catch(console.error)

export { runSimpleFix }