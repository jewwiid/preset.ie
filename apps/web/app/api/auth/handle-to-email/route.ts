import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { handle } = await request.json()

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      )
    }

    // Create a Supabase admin client to access auth.users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Look up user_id from handle in users_profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('user_id')
      .eq('handle', handle)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Handle not found' },
        { status: 404 }
      )
    }

    // Get email from auth.users using the user_id
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      profileData.user_id
    )

    if (userError || !userData?.user?.email) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email: userData.user.email })
  } catch (error) {
    console.error('Error in handle-to-email lookup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
