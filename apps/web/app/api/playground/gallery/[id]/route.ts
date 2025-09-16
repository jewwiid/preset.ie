import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { getUserFromRequest } from '../../../../../lib/auth-utils'

// Manually load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (from project root)
dotenv.config({ path: path.join(process.cwd(), '../../.env.local') })

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: imageId } = await params
    
    // Delete the image from gallery (only if it belongs to the user)
    const { error: deleteError } = await supabaseAdmin
      .from('playground_gallery')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('Gallery delete error:', deleteError)
      throw deleteError
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete image:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete image'
    }, { status: 500 })
  }
}
