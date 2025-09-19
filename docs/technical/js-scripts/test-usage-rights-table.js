const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testUsageRightsTable() {
  console.log('Testing usage_rights_options table...')
  
  // Test if table exists and has data
  const { data, error } = await supabase
    .from('usage_rights_options')
    .select('value, display_name, description, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  
  console.log('Query result:', { data, error })
  
  if (error) {
    console.error('Error details:', error)
    
    // Try to check if table exists
    const { data: tables, error: tableError } = await supabase.rpc('get_tables_info')
    console.log('Available tables check:', { tableError })
  } else {
    console.log('Success! Found', data?.length || 0, 'usage rights options')
    data?.forEach(option => {
      console.log(`- ${option.value}: ${option.display_name}`)
    })
  }
}

testUsageRightsTable()