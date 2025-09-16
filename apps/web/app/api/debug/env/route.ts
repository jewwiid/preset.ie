import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      WAVESPEED_API_KEY: process.env.WAVESPEED_API_KEY ? 'Set' : 'Missing',
      NODE_ENV: process.env.NODE_ENV,
      // Don't expose actual values for security
    }
    
    return NextResponse.json({
      success: true,
      environment: envCheck
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment'
    }, { status: 500 })
  }
}
