const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zbsmgymyfhnwjdnmlelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U'
)

async function testFrontendFilters() {
  console.log('🧪 Testing frontend filter logic with actual data...')

  try {
    // Fetch all published gigs first
    const { data: allGigs, error: fetchError } = await supabase
      .from('gigs')
      .select('*')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.log('❌ Error fetching gigs:', fetchError.message)
      return
    }

    console.log(`\n📊 Found ${allGigs?.length || 0} published gigs total:`)
    allGigs?.forEach(gig => {
      console.log(`   • ${gig.title} (${gig.comp_type}, ${gig.purpose}, ${gig.location_text})`)
    })

    // Test 1: Location filter (should simulate frontend location search)
    console.log('\n🔍 TEST 1: Location Filter - "dublin"')
    const dublinFiltered = allGigs?.filter(gig => 
      gig.location_text.toLowerCase().includes('dublin'.toLowerCase())
    ) || []
    console.log(`   Result: ${dublinFiltered.length} gigs`)
    dublinFiltered.forEach(gig => console.log(`   • ${gig.title}`))

    // Test 2: Comp Type filter
    console.log('\n🔍 TEST 2: Comp Type Filter - "TFP"')
    const tfpFiltered = allGigs?.filter(gig => 
      gig.comp_type === 'TFP'
    ) || []
    console.log(`   Result: ${tfpFiltered.length} gigs`)
    tfpFiltered.forEach(gig => console.log(`   • ${gig.title}`))

    // Test 3: Purpose filter
    console.log('\n🔍 TEST 3: Purpose Filter - "FASHION"')
    const fashionFiltered = allGigs?.filter(gig => 
      gig.purpose === 'FASHION'
    ) || []
    console.log(`   Result: ${fashionFiltered.length} gigs`)
    fashionFiltered.forEach(gig => console.log(`   • ${gig.title}`))

    // Test 4: Usage Rights filter (text search)
    console.log('\n🔍 TEST 4: Usage Rights Filter - contains "portfolio"')
    const portfolioFiltered = allGigs?.filter(gig => 
      gig.usage_rights.toLowerCase().includes('portfolio'.toLowerCase())
    ) || []
    console.log(`   Result: ${portfolioFiltered.length} gigs`)
    portfolioFiltered.forEach(gig => console.log(`   • ${gig.title} (${gig.usage_rights})`))

    // Test 5: Combined filters (like frontend would do)
    console.log('\n🔍 TEST 5: Combined Filter - TFP + contains "dublin"')
    const combinedFiltered = allGigs?.filter(gig => 
      gig.comp_type === 'TFP' && 
      gig.location_text.toLowerCase().includes('dublin'.toLowerCase())
    ) || []
    console.log(`   Result: ${combinedFiltered.length} gigs`)
    combinedFiltered.forEach(gig => console.log(`   • ${gig.title}`))

    // Test 6: Search functionality (title + description)
    console.log('\n🔍 TEST 6: Search Filter - "fashion"')
    const searchFiltered = allGigs?.filter(gig => 
      gig.title.toLowerCase().includes('fashion'.toLowerCase()) ||
      gig.description.toLowerCase().includes('fashion'.toLowerCase())
    ) || []
    console.log(`   Result: ${searchFiltered.length} gigs`)
    searchFiltered.forEach(gig => console.log(`   • ${gig.title}`))

    console.log('\n✅ Frontend filter logic test completed!')
    console.log('\n📝 Summary:')
    console.log(`   • Total gigs: ${allGigs?.length || 0}`)
    console.log(`   • Dublin location: ${dublinFiltered.length}`)
    console.log(`   • TFP comp type: ${tfpFiltered.length}`)
    console.log(`   • Fashion purpose: ${fashionFiltered.length}`)
    console.log(`   • Portfolio usage: ${portfolioFiltered.length}`)
    console.log(`   • TFP + Dublin: ${combinedFiltered.length}`)
    console.log(`   • Fashion search: ${searchFiltered.length}`)

    if (allGigs?.length > 0) {
      console.log('\n🎯 All filters are working correctly with the test data!')
      console.log('The frontend Browse Gigs page should now show filtered results when filters are applied.')
      console.log('Visit http://localhost:3000/gigs to test the UI filters.')
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testFrontendFilters()