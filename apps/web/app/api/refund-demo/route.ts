import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, userId, reason = 'test_failure' } = body

    if (!taskId || !userId) {
      return NextResponse.json(
        { error: 'Missing taskId or userId' },
        { status: 400 }
      )
    }

    // Initialize Supabase with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // DEMO: Simulate refund processing without complex database dependencies
    console.log('Processing refund for:', { taskId, userId, reason })

    // Check if refund policy allows refund for this reason
    const refundableReasons = ['internal_error', 'content_policy_violation', 'generation_failed', 'timeout']
    const shouldRefund = refundableReasons.includes(reason)

    if (!shouldRefund) {
      return NextResponse.json({
        success: false,
        message: `Refund not allowed for reason: ${reason}`,
        policy: {
          reason,
          refundable: false
        }
      })
    }

    // DEMO: Calculate refund amounts
    const creditsToRefund = 1
    const platformLoss = 4 // NanoBanana credits lost

    // DEMO: Create refund record
    const refundRecord = {
      id: `refund_${Date.now()}`,
      task_id: taskId,
      user_id: userId,
      credits_refunded: creditsToRefund,
      platform_credits_lost: platformLoss,
      refund_reason: reason,
      error_code: '500',
      error_message: 'Demo refund for testing',
      metadata: { demo: true },
      created_at: new Date().toISOString()
    }

    // Try to insert into credit_refunds table if it exists
    try {
      const { data: refund, error: refundError } = await supabase
        .from('credit_refunds')
        .insert(refundRecord)
        .select()
        .single()

      if (!refundError && refund) {
        console.log('Refund record created in database:', refund.id)
        
        return NextResponse.json({
          success: true,
          message: 'Refund processed successfully',
          refund: {
            id: refund.id,
            credits_refunded: creditsToRefund,
            platform_loss: platformLoss,
            reason: reason,
            created_at: refund.created_at
          }
        })
      }
    } catch (dbError) {
      console.log('Database operation skipped:', dbError)
    }

    // Return demo response even if database operations fail
    return NextResponse.json({
      success: true,
      message: 'Refund processed (demo mode)',
      refund: {
        id: refundRecord.id,
        credits_refunded: creditsToRefund,
        platform_loss: platformLoss,
        reason: reason,
        demo: true
      },
      policy: {
        reason,
        refundable: true,
        refund_percentage: 100
      }
    })

  } catch (error) {
    console.error('Refund demo error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}