import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '../../../../../lib/auth-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const presetId = resolvedParams.id

    // Get exampleId from request body
    const body = await request.json()
    const { exampleId } = body

    if (!exampleId) {
      return NextResponse.json({ error: 'Example ID required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user is admin or preset creator
    const { data: preset, error: presetError } = await supabase
      .from('presets')
      .select('creator_id')
      .eq('id', presetId)
      .single()

    if (presetError || !preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    // Check if user has permission (admin or creator)
    const { data: profile } = await supabase
      .from('users_profile')
      .select('user_id, role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isCreator = preset.creator_id === profile?.user_id

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the example to mark it as verified (promoted)
    const { data: updatedExample, error: updateError } = await supabase
      .from('playground_gallery')
      .update({
        is_verified: true,
        verification_timestamp: new Date().toISOString()
      })
      .eq('id', exampleId)
      .select()
      .single()

    if (updateError) {
      console.error('Error promoting example:', updateError)
      return NextResponse.json({ error: 'Failed to promote example' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      example: updatedExample
    })
  } catch (error) {
    console.error('Error in promote example API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
