#!/usr/bin/env node

/**
 * Script to add video motion styles to the style_prompts table
 * Run with: node add-video-styles.js
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '../../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const videoStyles = [
  {
    style_name: 'smooth',
    display_name: 'Smooth Motion',
    text_to_image_prompt: 'Create smooth, fluid motion with gentle camera movements and natural transitions',
    image_to_image_prompt: 'Apply smooth, fluid motion with gentle camera movements and natural transitions to',
    description: 'Smooth, flowing motion with gentle transitions',
    category: 'motion',
    is_active: true,
    sort_order: 100
  },
  {
    style_name: 'fast-paced',
    display_name: 'Fast-Paced',
    text_to_image_prompt: 'Create fast-paced, energetic motion with quick cuts and dynamic camera work',
    image_to_image_prompt: 'Apply fast-paced, energetic motion with quick cuts and dynamic camera work to',
    description: 'High-energy, fast motion with dynamic movement',
    category: 'motion',
    is_active: true,
    sort_order: 101
  },
  {
    style_name: 'slow-motion',
    display_name: 'Slow Motion',
    text_to_image_prompt: 'Create dramatic slow-motion effect with smooth, deliberate movements and enhanced details',
    image_to_image_prompt: 'Apply dramatic slow-motion effect with smooth, deliberate movements and enhanced details to',
    description: 'Dramatic slow-motion video effect',
    category: 'motion',
    is_active: true,
    sort_order: 102
  },
  {
    style_name: 'time-lapse',
    display_name: 'Time-Lapse',
    text_to_image_prompt: 'Create time-lapse effect showing accelerated passage of time with smooth transitions',
    image_to_image_prompt: 'Apply time-lapse effect showing accelerated passage of time with smooth transitions to',
    description: 'Accelerated time-lapse video',
    category: 'motion',
    is_active: true,
    sort_order: 103
  },
  {
    style_name: 'glitch',
    display_name: 'Glitch Effect',
    text_to_image_prompt: 'Create digital glitch aesthetic with distorted visuals, chromatic aberration, and digital artifacts',
    image_to_image_prompt: 'Apply digital glitch aesthetic with distorted visuals, chromatic aberration, and digital artifacts to',
    description: 'Digital glitch and distortion effects',
    category: 'artistic',
    is_active: true,
    sort_order: 104
  }
]

async function addVideoStyles() {
  console.log('🎬 Adding video motion styles to style_prompts table...\n')

  // First check if the table exists
  const { data: existingStyles, error: checkError } = await supabase
    .from('style_prompts')
    .select('style_name')
    .limit(1)

  if (checkError) {
    console.error('❌ Error checking style_prompts table:', checkError.message)
    console.log('\n💡 The style_prompts table may not exist yet.')
    console.log('   Please run the migration first:')
    console.log('   supabase db push')
    process.exit(1)
  }

  console.log('✅ style_prompts table exists\n')

  // Insert each style
  for (const style of videoStyles) {
    console.log(`Adding: ${style.display_name} (${style.style_name})...`)
    
    // Try to insert, if conflict, update
    const { data, error } = await supabase
      .from('style_prompts')
      .upsert(style, {
        onConflict: 'style_name'
      })
      .select()

    if (error) {
      console.error(`  ❌ Error: ${error.message}`)
    } else {
      console.log(`  ✅ Added successfully`)
    }
  }

  console.log('\n🎉 Video styles added successfully!\n')

  // Verify the styles were added
  console.log('📋 Verifying added styles...\n')
  const { data: motionStyles, error: verifyError } = await supabase
    .from('style_prompts')
    .select('style_name, display_name, category')
    .eq('category', 'motion')
    .order('sort_order')

  if (verifyError) {
    console.error('❌ Error verifying styles:', verifyError.message)
  } else {
    console.log('Motion styles in database:')
    motionStyles.forEach(style => {
      console.log(`  • ${style.display_name} (${style.style_name})`)
    })
  }

  // Also check the glitch style
  const { data: glitchStyle, error: glitchError } = await supabase
    .from('style_prompts')
    .select('style_name, display_name, category')
    .eq('style_name', 'glitch')
    .single()

  if (!glitchError && glitchStyle) {
    console.log(`\nArtistic style:`)
    console.log(`  • ${glitchStyle.display_name} (${glitchStyle.style_name})`)
  }

  console.log('\n✨ Done!')
}

// Run the script
addVideoStyles().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
