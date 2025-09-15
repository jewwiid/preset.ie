import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function GET(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  try {
    const { data: userCredits, error } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month, monthly_allowance')
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      // If user doesn't have credits record, create one
      if (error.code === 'PGRST116') {
        const { data: newCredits, error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            subscription_tier: 'FREE',
            monthly_allowance: 10,
            current_balance: 10
          })
          .select()
          .single()
        
        if (createError) throw createError
        
        return NextResponse.json({
          current_balance: newCredits.current_balance,
          consumed_this_month: newCredits.consumed_this_month,
          monthly_allowance: newCredits.monthly_allowance
        })
      }
      throw error
    }
    
    return NextResponse.json({
      current_balance: userCredits.current_balance,
      consumed_this_month: userCredits.consumed_this_month,
      monthly_allowance: userCredits.monthly_allowance
    })
  } catch (error) {
    console.error('Failed to fetch user credits:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}
