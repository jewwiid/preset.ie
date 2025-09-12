const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zbsmgymyfhnwjdnmlelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U'
)

async function checkGigStructure() {
  console.log('🔍 Checking current gig table structure...')

  try {
    // Try to fetch with all the fields the frontend expects
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Error:', error.message)
      return
    }

    console.log('✅ Gigs table accessible')
    
    if (data && data.length > 0) {
      console.log('📊 Available columns:', Object.keys(data[0]).sort())
    } else {
      console.log('📝 No gig data, but table structure is accessible')
      
      // Let's try to create a minimal test gig to see what fails
      console.log('\n🧪 Testing minimal gig creation...')
      
      // Check user profiles first
      const { data: profiles } = await supabase
        .from('users_profile')
        .select('id')
        .limit(1)
      
      if (!profiles || profiles.length === 0) {
        console.log('❌ No user profiles available for test')
        return
      }

      const testGig = {
        owner_user_id: profiles[0].id,
        title: 'Test Filter Fields',
        description: 'Testing what fields work',
        comp_type: 'TFP',
        location_text: 'Test Location, Dublin',
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        application_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        max_applicants: 5,
        usage_rights: 'Portfolio Only',
        status: 'PUBLISHED'
      }

      const { data: created, error: createError } = await supabase
        .from('gigs')
        .insert(testGig)
        .select('*')
        .single()

      if (createError) {
        console.log('❌ Error creating test gig:', createError.message)
      } else {
        console.log('✅ Test gig created!')
        console.log('📊 Created gig columns:', Object.keys(created).sort())
        
        // Clean up test gig
        await supabase.from('gigs').delete().eq('id', created.id)
        console.log('🗑️  Test gig deleted')
      }
    }

  } catch (error) {
    console.error('💥 Check failed:', error)
  }
}

checkGigStructure()