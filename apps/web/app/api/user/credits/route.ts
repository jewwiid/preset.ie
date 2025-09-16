import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

// Manually load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (from project root)
dotenv.config({ path: path.join(process.cwd(), '../../.env.local') })

export async function GET(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  try {
    // First get user profile to get subscription tier
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error('Failed to fetch user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }
    
    const subscriptionTier = userProfile?.subscription_tier || 'FREE'
    
    // Then get user credits
    const { data: userCredits, error } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, consumed_this_month, monthly_allowance')
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      // If user doesn't have credits record, create one
      if (error.code === 'PGRST116') {
        const { data: newCredits, error: createError } = await supabaseAdmin
          .from('user_credits')
          .insert({
            user_id: user.id,
            subscription_tier: subscriptionTier,
            monthly_allowance: subscriptionTier === 'PRO' ? 25 : subscriptionTier === 'PLUS' ? 10 : 0,
            current_balance: subscriptionTier === 'PRO' ? 25 : subscriptionTier === 'PLUS' ? 10 : 0
          })
          .select()
          .single()
        
        if (createError) throw createError
        
        return NextResponse.json({
          current_balance: newCredits.current_balance,
          consumed_this_month: newCredits.consumed_this_month,
          monthly_allowance: newCredits.monthly_allowance,
          subscription_tier: subscriptionTier
        })
      }
      throw error
    }
    
    return NextResponse.json({
      current_balance: userCredits.current_balance,
      consumed_this_month: userCredits.consumed_this_month,
      monthly_allowance: userCredits.monthly_allowance,
      subscription_tier: subscriptionTier
    })
  } catch (error) {
    console.error('Failed to fetch user credits:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}
