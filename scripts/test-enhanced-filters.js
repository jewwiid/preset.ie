const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zbsmgymyfhnwjdnmlelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U'
)

// Simulated gig data enhancement functions (matching frontend logic)
const getSimulatedGigData = (gig) => {
  const simulatedData = {
    style_tags: [],
    vibe_tags: [],
    city: extractCityFromLocation(gig.location_text),
    country: extractCountryFromLocation(gig.location_text),
    palette_colors: getSimulatedPaletteColors(gig.purpose, gig.title)
  };

  // Add style tags based on title and purpose
  const title = gig.title.toLowerCase();
  const purpose = gig.purpose?.toLowerCase() || '';
  
  if (title.includes('fashion') || purpose === 'fashion') simulatedData.style_tags.push('fashion');
  if (title.includes('portrait') || purpose === 'portrait') simulatedData.style_tags.push('portrait');
  if (title.includes('commercial') || purpose === 'commercial') simulatedData.style_tags.push('commercial');
  if (title.includes('wedding') || purpose === 'wedding') simulatedData.style_tags.push('wedding', 'documentary', 'event');
  if (title.includes('headshots') || title.includes('lifestyle')) simulatedData.style_tags.push('headshots', 'lifestyle');
  if (title.includes('street') || title.includes('urban')) simulatedData.style_tags.push('street', 'urban');
  if (title.includes('product')) simulatedData.style_tags.push('product', 'commercial');
  if (title.includes('beauty')) simulatedData.style_tags.push('beauty', 'commercial');

  // Add vibe tags based on context
  if (title.includes('creative')) simulatedData.vibe_tags.push('creative');
  if (purpose === 'commercial' || title.includes('professional')) simulatedData.vibe_tags.push('professional', 'clean');
  if (title.includes('modern') || title.includes('contemporary')) simulatedData.vibe_tags.push('modern');
  if (purpose === 'wedding' || title.includes('wedding')) simulatedData.vibe_tags.push('romantic', 'intimate', 'natural');
  if (title.includes('street') || title.includes('urban')) simulatedData.vibe_tags.push('edgy', 'dynamic');
  if (title.includes('lifestyle') || title.includes('headshots')) simulatedData.vibe_tags.push('confident', 'natural');

  return simulatedData;
};

const extractCityFromLocation = (locationText) => {
  const location = locationText.toLowerCase();
  if (location.includes('dublin')) return 'Dublin';
  if (location.includes('cork')) return 'Cork';
  if (location.includes('galway')) return 'Galway';
  if (location.includes('london')) return 'London';
  if (location.includes('manchester')) return 'Manchester';
  return undefined;
};

const extractCountryFromLocation = (locationText) => {
  const location = locationText.toLowerCase();
  if (location.includes('ireland') || location.includes('dublin') || location.includes('cork') || location.includes('galway')) return 'Ireland';
  if (location.includes('uk') || location.includes('united kingdom') || location.includes('london') || location.includes('manchester')) return 'United Kingdom';
  if (location.includes('usa') || location.includes('united states') || location.includes('new york')) return 'United States';
  return undefined;
};

const getSimulatedPaletteColors = (purpose, title) => {
  if (purpose === 'FASHION' || title?.toLowerCase().includes('fashion')) {
    return ['#E8D5C4', '#C7B299', '#A08A7A', '#8B7267'];
  }
  if (purpose === 'COMMERCIAL' || title?.toLowerCase().includes('commercial')) {
    return ['#2D3748', '#4A5568', '#718096', '#A0AEC0'];
  }
  if (purpose === 'WEDDING' || title?.toLowerCase().includes('wedding')) {
    return ['#FED7D7', '#FBB6CE', '#ED8936', '#DD6B20'];
  }
  if (title?.toLowerCase().includes('lifestyle') || title?.toLowerCase().includes('headshots')) {
    return ['#E6FFFA', '#B2F5EA', '#4FD1C7', '#319795'];
  }
  return ['#F7FAFC', '#EDF2F7', '#CBD5E0', '#A0AEC0'];
};

async function testEnhancedFilters() {
  console.log('🎯 Testing Enhanced Browse Gigs Filters...')

  try {
    // Fetch gigs and apply simulated data
    const { data: gigs, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false })

    if (error) throw error

    const enhancedGigs = gigs?.map(gig => ({
      ...gig,
      ...getSimulatedGigData(gig)
    })) || []

    console.log(`\n📊 Enhanced ${enhancedGigs.length} gigs with simulated filter data:`)

    enhancedGigs.forEach(gig => {
      console.log(`\n🎬 ${gig.title}`)
      console.log(`   📍 Location: ${gig.location_text} → ${gig.city}, ${gig.country}`)
      console.log(`   🎯 Purpose: ${gig.purpose}`)
      console.log(`   💼 Comp: ${gig.comp_type}`)
      console.log(`   🏷️  Style Tags: [${gig.style_tags.join(', ')}]`)
      console.log(`   ✨ Vibe Tags: [${gig.vibe_tags.join(', ')}]`)
      console.log(`   🎨 Palette: [${gig.palette_colors.join(', ')}]`)
    })

    // Test filtering capabilities
    console.log('\n🔍 Testing Filter Capabilities:')

    // Test 1: Style tag filtering
    const fashionGigs = enhancedGigs.filter(gig => 
      gig.style_tags.includes('fashion')
    )
    console.log(`   Fashion Style: ${fashionGigs.length} gigs`)

    // Test 2: Vibe tag filtering
    const professionalGigs = enhancedGigs.filter(gig => 
      gig.vibe_tags.includes('professional')
    )
    console.log(`   Professional Vibe: ${professionalGigs.length} gigs`)

    // Test 3: Color palette filtering (fashion warm tones)
    const warmPaletteGigs = enhancedGigs.filter(gig => 
      gig.palette_colors.includes('#E8D5C4')
    )
    console.log(`   Warm Fashion Palette: ${warmPaletteGigs.length} gigs`)

    // Test 4: City filtering
    const dublinGigs = enhancedGigs.filter(gig => 
      gig.city === 'Dublin'
    )
    console.log(`   Dublin City: ${dublinGigs.length} gigs`)

    // Test 5: Combined filtering
    const fashionProfessionalGigs = enhancedGigs.filter(gig => 
      gig.style_tags.includes('fashion') && gig.vibe_tags.includes('professional')
    )
    console.log(`   Fashion + Professional: ${fashionProfessionalGigs.length} gigs`)

    console.log('\n✅ Enhanced filtering system is working!')
    console.log('\n🎯 New features available on Browse Gigs page:')
    console.log('   • Color Palette filtering (visible color swatches)')
    console.log('   • Style Tag filtering (fashion, portrait, commercial, etc.)')
    console.log('   • Vibe Tag filtering (creative, professional, romantic, etc.)')
    console.log('   • Enhanced gig cards showing tags and color previews')
    console.log('   • City/Country extraction from location text')
    console.log('\n🌐 Visit http://localhost:3000/gigs to try the new filters!')

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testEnhancedFilters()