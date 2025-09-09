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

    // Check if refund policy allows refund for this reason
    const { data: policy } = await supabase
      .from('refund_policies')
      .select('*')
      .eq('error_type', reason)
      .single()

    if (!policy || !policy.should_refund) {
      return NextResponse.json(
        { success: false, message: 'Refund not allowed for this reason' },
        { status: 200 }
      )
    }

    // Get user's current credit balance
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single()

    let finalUserCredits = userCredits
    
    console.log('Credits lookup result:', { creditsError, userCredits })
    
    if (creditsError || !userCredits) {
      // Create credits record if it doesn't exist
      console.log('Creating new credits for user:', userId)
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          subscription_tier: 'free',
          balance: 0,
          lifetime_earned: 0,
          lifetime_consumed: 0,
          current_balance: 0,
          monthly_allowance: 0,
          consumed_this_month: 0
        })
        .select()
        .single()
      
      console.log('Insert result:', { newCredits, insertError })
      
      if (insertError || !newCredits) {
        console.error('Failed to create user credits:', insertError)
        return NextResponse.json(
          { error: 'User credits not found and could not be created', details: insertError },
          { status: 404 }
        )
      }
      
      finalUserCredits = newCredits
    }

    // Calculate refund amount (1 credit for user, 4 credits platform loss for NanoBanana)
    const creditsToRefund = 1
    const platformLoss = 4 // NanoBanana credits lost

    // Create refund record
    const { data: refund, error: refundError } = await supabase
      .from('credit_refunds')
      .insert({
        task_id: taskId,
        user_id: userId,
        credits_refunded: creditsToRefund,
        platform_credits_lost: platformLoss,
        refund_reason: reason,
        error_code: '500',
        error_message: 'Test failure for refund system',
        metadata: { test: true }
      })
      .select()
      .single()

    if (refundError) {
      console.error('Error creating refund:', refundError)
      return NextResponse.json(
        { error: 'Failed to create refund record' },
        { status: 500 }
      )
    }

    // Update user's credit balance
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: (finalUserCredits?.balance || 0) + creditsToRefund,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating user credits:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user credits' },
        { status: 500 }
      )
    }

    // Update enhancement task if it exists
    await supabase
      .from('enhancement_tasks')
      .update({
        refund_status: 'completed',
        refund_credits: creditsToRefund,
        refund_reason: reason,
        refunded_at: new Date().toISOString()
      })
      .eq('task_id', taskId)

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        credits_refunded: creditsToRefund,
        platform_loss: platformLoss,
        new_balance: (finalUserCredits?.balance || 0) + creditsToRefund
      }
    })

  } catch (error) {
    console.error('Test refund error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}