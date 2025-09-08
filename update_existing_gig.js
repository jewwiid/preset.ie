const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateGigLocation() {
  const gigId = '22dd9f45-8eaf-43e4-b068-033340b9931a';
  
  console.log('🔧 Updating gig location...\n');
  
  // Update the location for the existing gig
  const { data, error } = await supabase
    .from('gigs')
    .update({ 
      location_text: 'Dublin City Center - Studio',
      usage_rights: 'Portfolio use only'
    })
    .eq('id', gigId)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error updating gig:', error.message);
  } else {
    console.log('✅ Gig updated successfully!');
    console.log('   Title:', data.title);
    console.log('   Location:', data.location_text);
    console.log('   Usage Rights:', data.usage_rights);
    console.log('\n🔗 View at: http://localhost:3000/gigs/' + gigId);
  }
}

updateGigLocation();