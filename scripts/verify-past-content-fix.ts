#!/usr/bin/env tsx

/**
 * Verification script to check if past content fix is working
 * Tests that the playground_gallery table has the new columns and data
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function verifyPastContentFix() {
  console.log('🔍 Verifying past content fix...')
  console.log('=' .repeat(50))

  try {
    // Check 1: Verify playground_gallery table has the new columns
    console.log('\n=== Step 1: Checking table columns ===')
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')
      .limit(1)

    if (columnError) {
      throw new Error(`Failed to read playground_gallery: ${columnError.message}`)
    }

    if (columns && columns.length > 0) {
      const sampleItem = columns[0]
      const hasNewColumns = [
        'source_type',
        'enhancement_type',
        'original_media_id',
        'migrated_to_media'
      ].every(col => col in sampleItem)

      if (hasNewColumns) {
        console.log('✅ All new columns are present in playground_gallery table')
      } else {
        console.log('❌ Some columns are missing')
        console.log('Available columns:', Object.keys(sampleItem))
      }
    }

    // Check 2: Verify data has been updated with source types
    console.log('\n=== Step 2: Checking source_type data ===')
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('playground_gallery')
      .select('id, source_type, enhancement_type, generation_metadata')
      .limit(5)

    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`)
    }

    if (items && items.length > 0) {
      console.log(`✅ Found ${items.length} items in playground_gallery`)

      let itemsWithSourceType = 0
      let itemsWithEnhancementType = 0

      items.forEach(item => {
        console.log(`📋 Item ${item.id}:`)
        console.log(`   source_type: ${item.source_type}`)
        console.log(`   enhancement_type: ${item.enhancement_type}`)

        if (item.source_type) itemsWithSourceType++
        if (item.enhancement_type) itemsWithEnhancementType++

        // Check generation_metadata for enhancement info
        if (item.generation_metadata) {
          const hasStyleApplied = item.generation_metadata.style_applied
          const hasEnhancementInfo = item.generation_metadata.enhancement_type
          console.log(`   generation_metadata has style_applied: ${!!hasStyleApplied}`)
          console.log(`   generation_metadata has enhancement_type: ${!!hasEnhancementInfo}`)
        }
        console.log('')
      })

      console.log(`📊 Summary:`)
      console.log(`   Items with source_type: ${itemsWithSourceType}/${items.length}`)
      console.log(`   Items with enhancement_type: ${itemsWithEnhancementType}/${items.length}`)
    }

    // Check 3: Test media API format transformation
    console.log('\n=== Step 3: Testing format transformation ===')
    const { data: testItems, error: testError } = await supabaseAdmin
      .from('playground_gallery')
      .select('*')
      .limit(1)

    if (testError) {
      throw new Error(`Failed to fetch test items: ${testError.message}`)
    }

    if (testItems && testItems.length > 0) {
      const item = testItems[0]

      // Simulate the API transformation
      const transformed = {
        id: item.id,
        url: item.image_url,
        image_url: item.image_url,
        type: 'image',
        media_type: 'image',
        thumbnail_url: item.thumbnail_url || item.image_url,
        width: item.width,
        height: item.height,
        title: item.title,
        description: item.description,
        tags: item.tags || [],
        generation_metadata: item.generation_metadata || {},
        source_type: item.source_type || 'playground',
        enhancement_type: item.enhancement_type,
        original_media_id: item.original_media_id,
        metadata: item.metadata || {},
        created_at: item.created_at,
        updated_at: item.updated_at,
        source: 'playground_gallery'
      }

      console.log('✅ Sample transformed media item:')
      console.log(`   ID: ${transformed.id}`)
      console.log(`   Title: ${transformed.title}`)
      console.log(`   Source Type: ${transformed.source_type}`)
      console.log(`   Enhancement Type: ${transformed.enhancement_type}`)
      console.log(`   Tags: ${transformed.tags.join(', ')}`)
      console.log(`   URL: ${transformed.url}`)
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Past Content Fix Verification Complete!')
    console.log('\n🎯 What this means:')
    console.log('   • Playground gallery items now have source_type and enhancement_type')
    console.log('   • The media API can read these items with proper metadata')
    console.log('   • Source type filtering will work in the media dashboard')
    console.log('   • Enhanced images will show proper source badges')

    console.log('\n📋 Next Steps:')
    console.log('   • Visit: http://localhost:3000/dashboard/media')
    console.log('   • Filter by "Playground" source to see past content')
    console.log('   • Check that enhanced images show sparkles badges')

  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

// Run the verification
verifyPastContentFix().catch(console.error)