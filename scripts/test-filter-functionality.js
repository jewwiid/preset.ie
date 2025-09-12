const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zbsmgymyfhnwjdnmlelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U'
)

async function testFilterFunctionality() {
  console.log('🔍 Testing gig filter functionality...\n')

  try {
    // 1. Check current gig data (first check what columns exist)
    const { data: gigs, error: gigsError } = await supabase
      .from('gigs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (gigsError) {
      console.log('❌ Error fetching gigs:', gigsError.message)
      return
    }

    console.log(`📊 Found ${gigs?.length || 0} gigs in database`)

    if (!gigs || gigs.length === 0) {
      console.log('⚠️  No gigs found - creating sample gig data for testing...')
      await createSampleGigData()
      return
    }

    // 2. Analyze current gig data
    console.log('\n🔍 CURRENT GIG DATA ANALYSIS:')
    gigs.forEach((gig, index) => {
      console.log(`\n${index + 1}. ${gig.title}`)
      console.log(`   📍 Location: ${gig.location_text}${gig.city ? ` (City: ${gig.city})` : ''}`)
      console.log(`   💰 Comp Type: ${gig.comp_type}`)
      console.log(`   🏷️  Style Tags: ${gig.style_tags?.join(', ') || 'None'}`)
      console.log(`   ✨ Vibe Tags: ${gig.vibe_tags?.join(', ') || 'None'}`)
      console.log(`   🎯 Purpose: ${gig.purpose || 'None'}`)
      console.log(`   📋 Usage Rights: ${gig.usage_rights || 'None'}`)
      console.log(`   📅 Status: ${gig.status}`)
    })

    // 3. Test filter scenarios
    console.log('\n🧪 TESTING FILTER SCENARIOS:')

    // Test city filter
    const cities = [...new Set(gigs.map(g => g.city).filter(Boolean))]
    if (cities.length > 0) {
      console.log(`\n📍 City Filter Test - Cities: ${cities.join(', ')}`)
      for (const city of cities.slice(0, 2)) {
        const filtered = gigs.filter(g => 
          g.city?.toLowerCase().includes(city.toLowerCase()) ||
          g.location_text.toLowerCase().includes(city.toLowerCase())
        )
        console.log(`   "${city}": ${filtered.length} matches`)
      }
    }

    // Test comp type filter
    const compTypes = [...new Set(gigs.map(g => g.comp_type))]
    console.log(`\n💰 Comp Type Filter Test - Types: ${compTypes.join(', ')}`)
    compTypes.forEach(type => {
      const filtered = gigs.filter(g => g.comp_type === type)
      console.log(`   "${type}": ${filtered.length} matches`)
    })

    // Test style tags
    const allStyleTags = [...new Set(gigs.flatMap(g => g.style_tags || []))]
    if (allStyleTags.length > 0) {
      console.log(`\n🏷️  Style Tags Filter Test - Tags: ${allStyleTags.slice(0, 5).join(', ')}`)
      allStyleTags.slice(0, 3).forEach(tag => {
        const filtered = gigs.filter(g => 
          g.style_tags && g.style_tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
        )
        console.log(`   "${tag}": ${filtered.length} matches`)
      })
    }

    // Test search functionality
    console.log(`\n🔍 Search Filter Test:`)
    const searchTerms = ['portrait', 'fashion', 'outdoor', 'studio']
    searchTerms.forEach(term => {
      const filtered = gigs.filter(gig =>
        gig.title.toLowerCase().includes(term.toLowerCase()) ||
        gig.description.toLowerCase().includes(term.toLowerCase()) ||
        (gig.style_tags && gig.style_tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))) ||
        (gig.vibe_tags && gig.vibe_tags.some(tag => tag.toLowerCase().includes(term.toLowerCase())))
      )
      console.log(`   "${term}": ${filtered.length} matches`)
    })

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

async function createSampleGigData() {
  console.log('📝 Creating sample gig data for testing...')
  
  try {
    // First check if we have user profiles
    const { data: profiles } = await supabase
      .from('users_profile')
      .select('id')
      .limit(1)

    if (!profiles || profiles.length === 0) {
      console.log('❌ No user profiles found - cannot create sample gigs')
      return
    }

    const ownerId = profiles[0].id

    const sampleGigs = [
      {
        owner_user_id: ownerId,
        title: 'Fashion Portrait Shoot Downtown',
        description: 'Looking for a model for an urban fashion shoot. Street style vibes, natural lighting. Experience with editorial work preferred.',
        comp_type: 'TFP',
        location_text: 'Downtown Dublin, Ireland',
        city: 'Dublin',
        country: 'Ireland',
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 10,
        usage_rights: 'PORTFOLIO_ONLY',
        style_tags: ['fashion', 'street', 'portrait', 'urban'],
        vibe_tags: ['edgy', 'modern', 'bold'],
        purpose: 'FASHION',
        status: 'PUBLISHED'
      },
      {
        owner_user_id: ownerId,
        title: 'Serene Landscape Photography Workshop',
        description: 'Peaceful outdoor shooting session focusing on natural landscapes. Looking for someone who enjoys nature photography and has their own transport.',
        comp_type: 'PAID',
        location_text: 'Wicklow Mountains, Ireland',
        city: 'Wicklow',
        country: 'Ireland',
        start_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 5,
        usage_rights: 'SOCIAL_MEDIA_PERSONAL',
        style_tags: ['landscape', 'nature', 'outdoor'],
        vibe_tags: ['serene', 'bright', 'ethereal'],
        purpose: 'PORTFOLIO',
        status: 'PUBLISHED'
      },
      {
        owner_user_id: ownerId,
        title: 'Minimalist Product Photography',
        description: 'Clean, modern product shots for a tech startup. Studio setup available, looking for someone with experience in commercial photography.',
        comp_type: 'PAID',
        location_text: 'Cork City Studio, Cork',
        city: 'Cork',
        country: 'Ireland',
        start_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 8,
        usage_rights: 'COMMERCIAL_PRINT',
        style_tags: ['product', 'minimalist', 'studio'],
        vibe_tags: ['minimalist', 'modern', 'bright'],
        purpose: 'COMMERCIAL',
        status: 'PUBLISHED'
      },
      {
        owner_user_id: ownerId,
        title: 'Vintage Wedding Style Shoot',
        description: 'Romantic vintage-inspired wedding editorial. Looking for models who can portray classic elegance. Period costumes provided.',
        comp_type: 'EXPENSES',
        location_text: 'Historic Castle, Galway',
        city: 'Galway',
        country: 'Ireland',
        start_time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 6,
        usage_rights: 'EDITORIAL_PRINT',
        style_tags: ['wedding', 'vintage', 'editorial'],
        vibe_tags: ['romantic', 'vintage', 'ethereal'],
        purpose: 'EDITORIAL',
        status: 'PUBLISHED'
      }
    ]

    for (const gig of sampleGigs) {
      const { error } = await supabase
        .from('gigs')
        .insert(gig)

      if (error) {
        console.log(`❌ Error creating gig "${gig.title}":`, error.message)
      } else {
        console.log(`✅ Created gig: "${gig.title}"`)
      }
    }

    console.log('\n✅ Sample gig data created! Re-running filter tests...\n')
    await testFilterFunctionality()

  } catch (error) {
    console.error('💥 Error creating sample data:', error)
  }
}

testFilterFunctionality()