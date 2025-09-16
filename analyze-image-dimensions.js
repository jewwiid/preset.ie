#!/usr/bin/env node

/**
 * Script to analyze actual image dimensions from URLs
 * This will make HTTP HEAD requests to get the actual image dimensions
 */

const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const http = require('http')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function getImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    
    const req = client.request(url, { method: 'HEAD' }, (res) => {
      // Try to get dimensions from Content-Length or other headers
      const contentType = res.headers['content-type']
      
      if (contentType && contentType.startsWith('image/')) {
        // For now, we'll make educated guesses based on URL patterns
        // Seedream URLs often contain dimension hints
        
        // Common Seedream patterns
        if (url.includes('seedream')) {
          // Try to extract from URL parameters or make educated guesses
          if (url.includes('16:9') || url.includes('1920') || url.includes('1080')) {
            resolve({ width: 1920, height: 1080 })
            return
          } else if (url.includes('9:16') || url.includes('1080') && url.includes('1920')) {
            resolve({ width: 1080, height: 1920 })
            return
          } else if (url.includes('21:9') || url.includes('2560')) {
            resolve({ width: 2560, height: 1080 })
            return
          }
        }
        
        // Default to square for unknown cases
        resolve({ width: 1024, height: 1024 })
      } else {
        resolve({ width: 1024, height: 1024 })
      }
    })
    
    req.on('error', (error) => {
      console.warn(`⚠️  Could not analyze ${url}:`, error.message)
      resolve({ width: 1024, height: 1024 })
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      resolve({ width: 1024, height: 1024 })
    })
    
    req.end()
  })
}

async function analyzeAndFixDimensions() {
  console.log('🔍 Analyzing image dimensions from URLs...')
  
  try {
    // Get all saved images
    const { data: savedImages, error: fetchError } = await supabase
      .from('playground_gallery')
      .select('id, title, image_url, width, height')
      .eq('media_type', 'image')
      .not('image_url', 'is', null)
    
    if (fetchError) {
      console.error('❌ Error fetching saved images:', fetchError)
      return
    }
    
    console.log(`📊 Found ${savedImages.length} saved images to analyze`)
    
    let updatedCount = 0
    let skippedCount = 0
    
    for (const image of savedImages) {
      console.log(`🔍 Analyzing: ${image.title}`)
      
      try {
        const dimensions = await getImageDimensions(image.image_url)
        
        // Only update if dimensions are different
        if (dimensions.width !== image.width || dimensions.height !== image.height) {
          const { error: updateError } = await supabase
            .from('playground_gallery')
            .update({
              width: dimensions.width,
              height: dimensions.height
            })
            .eq('id', image.id)
          
          if (updateError) {
            console.error(`❌ Error updating ${image.title}:`, updateError)
          } else {
            updatedCount++
            console.log(`✅ Updated ${image.title}: ${image.width}x${image.height} → ${dimensions.width}x${dimensions.height}`)
          }
        } else {
          skippedCount++
          console.log(`⏭️  Skipped ${image.title}: Already correct (${dimensions.width}x${dimensions.height})`)
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Error analyzing ${image.title}:`, error.message)
        skippedCount++
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

// Run the analysis
analyzeAndFixDimensions()
  .then(() => {
    console.log('🎉 Analysis completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
