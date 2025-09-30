#!/usr/bin/env node

/**
 * Script to populate sample platform images for testing
 * Run with: node scripts/populate-sample-images.js
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample images data
const sampleImages = [
  // Homepage Images
  {
    image_key: 'homepage_hero_bg',
    image_type: 'homepage',
    category: 'hero',
    image_url: '/hero-bg.jpeg',
    alt_text: 'Creative photography background',
    title: 'Hero Background',
    description: 'Main homepage background image',
    usage_context: { section: 'hero', responsive: true },
    is_active: true,
    display_order: 1
  },
  {
    image_key: 'homepage_feature_1',
    image_type: 'homepage',
    category: 'features',
    image_url: '/images/homepage/feature-gigs.jpg',
    alt_text: 'Gig posting and browsing',
    title: 'Post & Browse Gigs',
    description: 'Feature showcase for gig functionality',
    usage_context: { section: 'features', feature_index: 1 },
    is_active: true,
    display_order: 2
  },
  {
    image_key: 'homepage_feature_2',
    image_type: 'homepage',
    category: 'features',
    image_url: '/images/homepage/feature-showcases.jpg',
    alt_text: 'Portfolio showcases',
    title: 'In-App Showcases',
    description: 'Feature showcase for portfolio functionality',
    usage_context: { section: 'features', feature_index: 2 },
    is_active: true,
    display_order: 3
  },
  {
    image_key: 'homepage_feature_3',
    image_type: 'homepage',
    category: 'features',
    image_url: '/images/homepage/feature-safety.jpg',
    alt_text: 'Safe and trusted platform',
    title: 'Safe & Trusted',
    description: 'Feature showcase for safety features',
    usage_context: { section: 'features', feature_index: 3 },
    is_active: true,
    display_order: 4
  },

  // Cinematic Parameter Examples (using placeholder images for now)
  {
    image_key: 'cinematic_portrait_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-portrait.jpg',
    alt_text: 'Cinematic portrait example',
    title: 'Portrait',
    description: 'Example of cinematic portrait style',
    usage_context: { preset_key: 'portrait', parameter_demo: true },
    is_active: true,
    display_order: 1
  },
  {
    image_key: 'cinematic_landscape_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-landscape.jpg',
    alt_text: 'Cinematic landscape example',
    title: 'Landscape',
    description: 'Example of cinematic landscape style',
    usage_context: { preset_key: 'landscape', parameter_demo: true },
    is_active: true,
    display_order: 2
  },
  {
    image_key: 'cinematic_cinematic_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-cinematic.jpg',
    alt_text: 'Cinematic style example',
    title: 'Cinematic',
    description: 'Example of cinematic movie-like style',
    usage_context: { preset_key: 'cinematic', parameter_demo: true },
    is_active: true,
    display_order: 3
  },
  {
    image_key: 'cinematic_fashion_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-fashion.jpg',
    alt_text: 'Cinematic fashion example',
    title: 'Fashion',
    description: 'Example of cinematic fashion photography',
    usage_context: { preset_key: 'fashion', parameter_demo: true },
    is_active: true,
    display_order: 4
  },
  {
    image_key: 'cinematic_street_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-street.jpg',
    alt_text: 'Cinematic street example',
    title: 'Street',
    description: 'Example of cinematic street photography',
    usage_context: { preset_key: 'street', parameter_demo: true },
    is_active: true,
    display_order: 5
  },
  {
    image_key: 'cinematic_commercial_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-commercial.jpg',
    alt_text: 'Cinematic commercial example',
    title: 'Commercial',
    description: 'Example of cinematic commercial photography',
    usage_context: { preset_key: 'commercial', parameter_demo: true },
    is_active: true,
    display_order: 6
  },
  {
    image_key: 'cinematic_artistic_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-artistic.jpg',
    alt_text: 'Cinematic artistic example',
    title: 'Artistic',
    description: 'Example of cinematic artistic photography',
    usage_context: { preset_key: 'artistic', parameter_demo: true },
    is_active: true,
    display_order: 7
  },
  {
    image_key: 'cinematic_documentary_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-documentary.jpg',
    alt_text: 'Cinematic documentary example',
    title: 'Documentary',
    description: 'Example of cinematic documentary style',
    usage_context: { preset_key: 'documentary', parameter_demo: true },
    is_active: true,
    display_order: 8
  },
  {
    image_key: 'cinematic_nature_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-nature.jpg',
    alt_text: 'Cinematic nature example',
    title: 'Nature',
    description: 'Example of cinematic nature photography',
    usage_context: { preset_key: 'nature', parameter_demo: true },
    is_active: true,
    display_order: 9
  },
  {
    image_key: 'cinematic_urban_example',
    image_type: 'preset_visual_aid',
    category: 'cinematic_parameters',
    image_url: '/images/preset-examples/cinematic-urban.jpg',
    alt_text: 'Cinematic urban example',
    title: 'Urban',
    description: 'Example of cinematic urban photography',
    usage_context: { preset_key: 'urban', parameter_demo: true },
    is_active: true,
    display_order: 10
  }
]

async function populateImages() {
  console.log('🚀 Starting to populate sample platform images...')

  try {
    // First, check if images already exist
    const { data: existingImages } = await supabase
      .from('platform_images')
      .select('image_key')

    const existingKeys = new Set(existingImages?.map(img => img.image_key) || [])
    
    // Filter out existing images
    const newImages = sampleImages.filter(img => !existingKeys.has(img.image_key))
    
    if (newImages.length === 0) {
      console.log('✅ All sample images already exist in the database')
      return
    }

    console.log(`📝 Found ${newImages.length} new images to insert`)

    // Insert new images
    const { data: insertedImages, error } = await supabase
      .from('platform_images')
      .insert(newImages)
      .select()

    if (error) {
      console.error('❌ Error inserting images:', error)
      return
    }

    console.log(`✅ Successfully inserted ${insertedImages.length} images`)

    // Now create preset visual aids for cinematic parameters
    console.log('🔗 Creating preset visual aids...')
    
    const cinematicPresets = [
      'portrait', 'landscape', 'cinematic', 'fashion', 'street',
      'commercial', 'artistic', 'documentary', 'nature', 'urban'
    ]

    const visualAids = []
    
    for (const preset of cinematicPresets) {
      const image = insertedImages.find(img => 
        img.image_key === `cinematic_${preset}_example`
      )
      
      if (image) {
        visualAids.push({
          preset_key: preset,
          platform_image_id: image.id,
          visual_aid_type: 'parameter_demo',
          display_title: `${preset.charAt(0).toUpperCase() + preset.slice(1)} Style Example`,
          display_description: `See how the ${preset} preset transforms your images`,
          is_primary: true,
          display_order: 1
        })
      }
    }

    if (visualAids.length > 0) {
      const { error: visualAidError } = await supabase
        .from('preset_visual_aids')
        .insert(visualAids)

      if (visualAidError) {
        console.error('❌ Error creating visual aids:', visualAidError)
      } else {
        console.log(`✅ Successfully created ${visualAids.length} preset visual aids`)
      }
    }

    console.log('🎉 Sample images population completed!')
    console.log('\n📋 Summary:')
    console.log(`- Platform images: ${insertedImages.length}`)
    console.log(`- Preset visual aids: ${visualAids.length}`)
    console.log('\n💡 Note: The image URLs are placeholders. You\'ll need to upload actual images and update the URLs.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
populateImages()
  .then(() => {
    console.log('✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
