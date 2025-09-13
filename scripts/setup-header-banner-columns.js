const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupHeaderBannerColumns() {
  console.log('🚀 Setting up header banner columns...')
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-header-banner-columns.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📝 Adding header_banner_url column...')
    const { error: urlError } = await supabase
      .from('users_profile')
      .select('header_banner_url')
      .limit(1)
    
    if (urlError && urlError.code === 'PGRST204') {
      // Column doesn't exist, add it
      console.log('   Adding header_banner_url column...')
      const { error: alterError } = await supabase.rpc('exec', { 
        sql: 'ALTER TABLE users_profile ADD COLUMN header_banner_url TEXT;' 
      })
      
      if (alterError) {
        console.error('❌ Failed to add header_banner_url:', alterError.message)
        process.exit(1)
      }
    } else if (urlError) {
      console.error('❌ Error checking header_banner_url:', urlError.message)
      process.exit(1)
    } else {
      console.log('   ✅ header_banner_url column already exists')
    }
    
    console.log('📝 Adding header_banner_position column...')
    const { error: posError } = await supabase
      .from('users_profile')
      .select('header_banner_position')
      .limit(1)
    
    if (posError && (posError.code === 'PGRST204' || posError.message.includes('does not exist'))) {
      // Column doesn't exist, add it
      console.log('   Adding header_banner_position column...')
      const { error: alterError } = await supabase.rpc('exec', { 
        sql: 'ALTER TABLE users_profile ADD COLUMN header_banner_position TEXT DEFAULT \'{"y":0,"scale":1}\';' 
      })
      
      if (alterError) {
        console.error('❌ Failed to add header_banner_position:', alterError.message)
        process.exit(1)
      }
    } else if (posError) {
      console.error('❌ Error checking header_banner_position:', posError.message)
      process.exit(1)
    } else {
      console.log('   ✅ header_banner_position column already exists')
    }
    
    console.log('✅ Header banner columns added successfully!')
    console.log('   - header_banner_url (TEXT)')
    console.log('   - header_banner_position (TEXT, default: {"y":0,"scale":1})')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupHeaderBannerColumns()
