#!/usr/bin/env node

/**
 * Manual script to fix aspect ratios for specific images
 * You can specify which images should have different aspect ratios
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Manual mappings for images that should have different aspect ratios
// Based on the image descriptions, these should have different aspect ratios
const aspectRatioOverrides = {
  'a night in tokeyo noire neon': { width: 1920, height: 1080, aspectRatio: '16:9' },
  'a car n la noire': { width: 1920, height: 1080, aspectRatio: '16:9' },
  'make this image look liek it was shot in venice': { width: 1920, height: 1080, aspectRatio: '16:9' },
  'a plane in a transformers movie': { width: 1920, height: 1080, aspectRatio: '16:9' }
}

async function listAllImages() {
  console.log('📋 Listing all saved images:')
  
  const { data: images, error } = await supabase
    .from('playground_gallery')
    .select('id, title, width, height, image_url')
    .eq('media_type', 'image')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching images:', error)
    return
  }
  
  images.forEach((img, index) => {
    const aspectRatio = img.width / img.height
    const ratioLabel = aspectRatio === 1 ? '1:1' : 
                     Math.abs(aspectRatio - 16/9) < 0.1 ? '16:9' :
                     Math.abs(aspectRatio - 9/16) < 0.1 ? '9:16' :
                     Math.abs(aspectRatio - 21/9) < 0.1 ? '21:9' :
                     `${img.width}:${img.height}`
    
    console.log(`${index + 1}. "${img.title}" - ${img.width}x${img.height} (${ratioLabel})`)
  })
  
  console.log('\n💡 To fix specific images, edit the aspectRatioOverrides object in this script')
  console.log('   Example: "image title": { width: 1920, height: 1080, aspectRatio: "16:9" }')
}

async function applyOverrides() {
  if (Object.keys(aspectRatioOverrides).length === 0) {
    console.log('ℹ️  No overrides specified. Run listAllImages() to see available images.')
    return
  }
  
  console.log('🔧 Applying aspect ratio overrides...')
  
  for (const [title, dimensions] of Object.entries(aspectRatioOverrides)) {
    const { data: images, error: fetchError } = await supabase
      .from('playground_gallery')
      .select('id, title, width, height')
      .eq('media_type', 'image')
      .ilike('title', `%${title}%`)
    
    if (fetchError) {
      console.error(`❌ Error fetching images for "${title}":`, fetchError)
      continue
    }
    
    if (images.length === 0) {
      console.log(`⚠️  No images found matching "${title}"`)
      continue
    }
    
    for (const image of images) {
      const { error: updateError } = await supabase
        .from('playground_gallery')
        .update({
          width: dimensions.width,
          height: dimensions.height
        })
        .eq('id', image.id)
      
      if (updateError) {
        console.error(`❌ Error updating "${image.title}":`, updateError)
      } else {
        console.log(`✅ Updated "${image.title}": ${image.width}x${image.height} → ${dimensions.width}x${dimensions.height} (${dimensions.aspectRatio})`)
      }
    }
  }
}

// Main execution
async function main() {
  const command = process.argv[2]
  
  if (command === 'list') {
    await listAllImages()
  } else if (command === 'apply') {
    await applyOverrides()
  } else {
    console.log('Usage:')
    console.log('  node manual-fix-aspect-ratios.js list   - List all images')
    console.log('  node manual-fix-aspect-ratios.js apply  - Apply overrides')
    console.log('\nFirst run "list" to see available images, then edit the script to add overrides.')
  }
}

main().catch(console.error)
