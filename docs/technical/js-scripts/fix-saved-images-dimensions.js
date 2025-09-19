#!/usr/bin/env node

/**
 * Script to fix aspect ratios for existing saved images in the gallery
 * This will update the width/height fields based on generation metadata
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixSavedImagesDimensions() {
  console.log('🔧 Starting to fix saved images dimensions...')
  
  try {
    // Get all saved images that have generation metadata
    const { data: savedImages, error: fetchError } = await supabase
      .from('playground_gallery')
      .select('id, title, width, height, generation_metadata')
      .not('generation_metadata', 'is', null)
      .eq('media_type', 'image')
    
    if (fetchError) {
      console.error('❌ Error fetching saved images:', fetchError)
      return
    }
    
    console.log(`📊 Found ${savedImages.length} saved images with metadata`)
    
    let updatedCount = 0
    let skippedCount = 0
    
    for (const image of savedImages) {
      const metadata = image.generation_metadata
      let newWidth = image.width
      let newHeight = image.height
      let updated = false
      
      // Try to extract dimensions from resolution metadata
      if (metadata.resolution) {
        const resolutionMatch = metadata.resolution.match(/(\d+)x(\d+)/)
        if (resolutionMatch) {
          newWidth = parseInt(resolutionMatch[1])
          newHeight = parseInt(resolutionMatch[2])
          updated = true
          console.log(`📐 ${image.title}: Resolution ${metadata.resolution} → ${newWidth}x${newHeight}`)
        }
      }
      
      // If no resolution, try aspect ratio
      if (!updated && metadata.aspect_ratio) {
        const aspectRatio = metadata.aspect_ratio
        if (aspectRatio === '16:9') {
          newWidth = 1920
          newHeight = 1080
          updated = true
        } else if (aspectRatio === '9:16') {
          newWidth = 1080
          newHeight = 1920
          updated = true
        } else if (aspectRatio === '21:9') {
          newWidth = 2560
          newHeight = 1080
          updated = true
        } else if (aspectRatio === '4:3') {
          newWidth = 1024
          newHeight = 768
          updated = true
        } else if (aspectRatio === '3:4') {
          newWidth = 768
          newHeight = 1024
          updated = true
        }
        
        if (updated) {
          console.log(`📐 ${image.title}: Aspect ratio ${aspectRatio} → ${newWidth}x${newHeight}`)
        }
      }
      
      // Update the database if we found new dimensions
      if (updated && (newWidth !== image.width || newHeight !== image.height)) {
        const { error: updateError } = await supabase
          .from('playground_gallery')
          .update({
            width: newWidth,
            height: newHeight
          })
          .eq('id', image.id)
        
        if (updateError) {
          console.error(`❌ Error updating ${image.title}:`, updateError)
        } else {
          updatedCount++
          console.log(`✅ Updated ${image.title}: ${image.width}x${image.height} → ${newWidth}x${newHeight}`)
        }
      } else {
        skippedCount++
        console.log(`⏭️  Skipped ${image.title}: No dimension data found`)
      }
    }
    
    console.log('\n📊 Summary:')
    console.log(`✅ Updated: ${updatedCount} images`)
    console.log(`⏭️  Skipped: ${skippedCount} images`)
    console.log(`📊 Total processed: ${savedImages.length} images`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the fix
fixSavedImagesDimensions()
  .then(() => {
    console.log('🎉 Fix completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
