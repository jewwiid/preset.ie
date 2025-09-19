import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth API called')
    
    const { user, error } = await getUserFromRequest(request)
    
    if (error || !user) {
      console.log('❌ No user found in request:', error)
      return NextResponse.json({ 
        authenticated: false, 
        error: error || 'No user found' 
      }, { status: 401 })
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role
    })
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('❌ Debug auth error:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
