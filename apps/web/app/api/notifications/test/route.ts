import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { recipient_id, type = 'system_update', title, message } = await request.json()

    if (!recipient_id || !title) {
      return NextResponse.json(
        { error: 'recipient_id and title are required' },
        { status: 400 }
      )
    }

    // Create a test notification
    const testNotification = {
      recipient_id,
      type,
      category: 'system',
      title,
      message: message || 'This is a test notification from your enhanced notification system!',
      delivered_push: false,
      delivered_email: false,
      delivered_in_app: true,
      action_url: '/settings',
      action_data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single()

    if (error) {
      console.error('Failed to create test notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Test notification created:', data.id)

    return NextResponse.json({
      success: true,
      notification: data,
      message: 'Test notification sent successfully!'
    })

  } catch (error: any) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to send a quick test notification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      )
    }

    // Send a test notification using the POST method
    const testResponse = await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({
        recipient_id: userId,
        type: 'system_update',
        title: '🎉 Notification System Active!',
        message: 'Your enhanced notification system with mobile-optimized toasts is now live and working perfectly!'
      })
    }))

    return testResponse

  } catch (error: any) {
    console.error('GET test notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}