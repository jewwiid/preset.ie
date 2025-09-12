import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const handle = searchParams.get('handle')
    
    if (!handle) {
      return NextResponse.json({ error: 'Handle parameter is required' }, { status: 400 })
    }
    
    // Basic validation
    if (handle.length < 3) {
      return NextResponse.json({ 
        available: false, 
        error: 'Handle must be at least 3 characters' 
      })
    }
    
    if (!/^[a-z][a-z0-9_]*$/.test(handle)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Handle must start with a letter and contain only lowercase letters, numbers, and underscores' 
      })
    }
    
    // Check if handle exists in database
    const { data: existingUser, error } = await supabase
      .from('users_profile')
      .select('handle')
      .eq('handle', handle)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (handle is available)
      console.error('Database error checking handle:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    const available = !existingUser
    
    return NextResponse.json({ 
      available,
      handle,
      ...(available ? {} : { error: 'Handle is already taken' })
    })
    
  } catch (error) {
    console.error('Error checking handle availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}