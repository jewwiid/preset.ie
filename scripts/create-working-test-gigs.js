const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zbsmgymyfhnwjdnmlelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U'
)

async function createTestGigs() {
  console.log('🎬 Creating test gigs with actual database schema...')

  try {
    // First get a user profile to use as owner
    const { data: profiles } = await supabase
      .from('users_profile')
      .select('id')
      .limit(1)

    if (!profiles || profiles.length === 0) {
      console.log('❌ No user profiles available for test')
      return
    }

    const ownerUserId = profiles[0].id
    console.log('✅ Using owner user ID:', ownerUserId)

    // Test gigs with varying attributes to test all filters
    const testGigs = [
      {
        owner_user_id: ownerUserId,
        title: 'Fashion Portrait Session in Dublin',
        description: 'Looking for a creative model for a fashion portrait session in Dublin city center.',
        comp_type: 'TFP',
        purpose: 'FASHION',
        location_text: 'Dublin, Ireland',
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 8,
        usage_rights: 'Portfolio use only',
        status: 'PUBLISHED'
      },
      {
        owner_user_id: ownerUserId,
        title: 'Commercial Product Shoot in Cork',
        description: 'Hand model needed for beauty product photography session.',
        comp_type: 'PAID',
        purpose: 'COMMERCIAL',
        location_text: 'Cork City, Ireland',
        start_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 3,
        usage_rights: 'Commercial use, social media, advertising',
        status: 'PUBLISHED'
      },
      {
        owner_user_id: ownerUserId,
        title: 'Wedding Photography Assistant Needed',
        description: 'Second shooter needed for intimate wedding ceremony in Galway.',
        comp_type: 'EXPENSES',
        purpose: 'WEDDING',
        location_text: 'Galway, Ireland',
        start_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 2,
        usage_rights: 'Portfolio use with permission',
        status: 'PUBLISHED'
      },
      {
        owner_user_id: ownerUserId,
        title: 'Lifestyle Headshots in London',
        description: 'Professional headshot session for actors and creatives.',
        comp_type: 'TFP',
        purpose: 'PORTRAIT',
        location_text: 'London, United Kingdom',
        start_time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 10,
        usage_rights: 'Full commercial rights',
        status: 'PUBLISHED'
      },
      {
        owner_user_id: ownerUserId,
        title: 'Street Style Photography Manchester',
        description: 'Urban fashion shoot in Manchester city center.',
        comp_type: 'PAID',
        purpose: 'FASHION',
        location_text: 'Manchester, United Kingdom',
        start_time: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 5,
        usage_rights: 'Social media only',
        status: 'PUBLISHED'
      }
    ]

    console.log('📝 Creating test gigs...')

    for (let i = 0; i < testGigs.length; i++) {
      const gig = testGigs[i]
      console.log(`\n🎭 Creating gig ${i + 1}: "${gig.title}"`)

      const { data: created, error: createError } = await supabase
        .from('gigs')
        .insert(gig)
        .select('*')
        .single()

      if (createError) {
        console.log(`❌ Error creating gig ${i + 1}:`, createError.message)
        console.log('Full error:', createError)
      } else {
        console.log(`✅ Created gig: ${created.title} (ID: ${created.id})`)
        console.log(`   📍 Location: ${created.location_text}`)
        console.log(`   💰 Comp: ${created.comp_type}`)
        console.log(`   🎯 Purpose: ${created.purpose}`)
        console.log(`   📋 Usage Rights: ${created.usage_rights}`)
      }
    }

    console.log('\n🎉 Test gig creation completed!')
    console.log('\n📊 Testing filter functionality...')

    // Test each filter type
    console.log('\n1️⃣ Testing location filter (Dublin):')
    const { data: dublinGigs } = await supabase
      .from('gigs')
      .select('id, title, location_text')
      .ilike('location_text', '%dublin%')
      .eq('status', 'PUBLISHED')

    console.log(`   Found ${dublinGigs?.length || 0} gigs in Dublin:`, dublinGigs?.map(g => g.title))

    console.log('\n2️⃣ Testing comp_type filter (TFP):')
    const { data: tfpGigs } = await supabase
      .from('gigs')
      .select('id, title, comp_type')
      .eq('comp_type', 'TFP')
      .eq('status', 'PUBLISHED')

    console.log(`   Found ${tfpGigs?.length || 0} TFP gigs:`, tfpGigs?.map(g => g.title))

    console.log('\n3️⃣ Testing purpose filter (FASHION):')
    const { data: fashionGigs } = await supabase
      .from('gigs')
      .select('id, title, purpose')
      .eq('purpose', 'FASHION')
      .eq('status', 'PUBLISHED')

    console.log(`   Found ${fashionGigs?.length || 0} fashion gigs:`, fashionGigs?.map(g => g.title))

    console.log('\n4️⃣ Testing usage_rights filter (portfolio):')
    const { data: portfolioGigs } = await supabase
      .from('gigs')
      .select('id, title, usage_rights')
      .ilike('usage_rights', '%portfolio%')
      .eq('status', 'PUBLISHED')

    console.log(`   Found ${portfolioGigs?.length || 0} portfolio-usage gigs:`, portfolioGigs?.map(g => g.title))

    console.log('\n✅ Filter functionality test completed!')

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

createTestGigs()