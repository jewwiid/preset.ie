import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: presetId } = await params

    // Get user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Insert into preset_usage table
    // This will trigger the notify_preset_usage() function which creates notifications
    const { data: usageRecord, error: usageError } = await supabase
      .from('preset_usage')
      .insert({
        preset_id: presetId,
        user_id: user.id
      })
      .select()
      .single()

    if (usageError) {
      console.error('Error tracking preset usage:', usageError)
      return NextResponse.json(
        { error: 'Failed to track preset usage', details: usageError.message },
        { status: 500 }
      )
    }

    console.log('✅ Preset usage tracked:', {
      presetId,
      userId: user.id,
      usageRecordId: usageRecord.id
    })

    // Also increment the usage_count on the preset
    // First get the current usage count
    const { data: presetData, error: fetchError } = await supabase
      .from('presets')
      .select('usage_count')
      .eq('id', presetId)
      .single()

    if (!fetchError && presetData) {
      const { error: updateError } = await supabase
        .from('presets')
        .update({
          usage_count: (presetData.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', presetId)

      if (updateError) {
        console.error('Error updating preset usage count:', updateError)
        // Don't fail the request if this fails, usage is already tracked
      }
    }

    return NextResponse.json({
      success: true,
      usageRecordId: usageRecord.id
    })

  } catch (error) {
    console.error('Error in preset usage API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
