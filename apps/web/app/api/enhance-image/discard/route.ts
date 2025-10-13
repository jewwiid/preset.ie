import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteEnhancedImage, isExternalImageUrl } from '../../../../lib/enhanced-image-storage'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { itemId, moodboardId } = await request.json()
    
    if (!itemId || !moodboardId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: itemId, moodboardId' },
        { status: 400 }
      )
    }

    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Create clients
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get the moodboard to verify ownership and get item details
    const { data: moodboard, error: moodboardError } = await supabaseAdmin
      .from('moodboards')
      .select('*')
      .eq('id', moodboardId)
      .single()

    if (moodboardError || !moodboard) {
      return NextResponse.json(
        { success: false, error: 'Moodboard not found' },
        { status: 404 }
      )
    }

    // Check if user owns this moodboard
    const { data: profile } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.id !== moodboard.owner_user_id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not own this moodboard' },
        { status: 403 }
      )
    }

    // Find the item in the moodboard
    const items = moodboard.items || []
    const itemIndex = items.findIndex((item: any) => item.id === itemId)
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Item not found in moodboard' },
        { status: 404 }
      )
    }

    const item = items[itemIndex]
    
    // Check if item has an enhanced version
    if (!item.enhanced_url) {
      return NextResponse.json(
        { success: false, error: 'Item does not have an enhanced version' },
        { status: 400 }
      )
    }

    // If the enhanced image is stored in our bucket, delete it
    if (!isExternalImageUrl(item.enhanced_url)) {
      console.log('🗑️ Deleting enhanced image from storage:', item.enhanced_url)
      
      const deleteResult = await deleteEnhancedImage(item.enhanced_url, user.id)
      
      if (!deleteResult.success) {
        console.warn('⚠️ Failed to delete enhanced image from storage:', deleteResult.error)
        // Continue anyway - the user still wants to discard it
      }
    }

    // Update the moodboard item to remove enhanced version
    const updatedItems = [...items]
    updatedItems[itemIndex] = {
      ...item,
      url: item.original_url || item.url, // Reset to original URL
      enhanced_url: undefined,
      enhancement_status: undefined,
      showing_original: false,
      source: item.original_url ? 'upload' : item.source // Reset source
    }

    // Update the moodboard in database
    const { error: updateError } = await supabaseAdmin
      .from('moodboards')
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodboardId)

    if (updateError) {
      console.error('❌ Failed to update moodboard:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update moodboard' },
        { status: 500 }
      )
    }

    console.log('✅ Enhanced image discarded successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced image discarded successfully',
      updatedItem: updatedItems[itemIndex]
    })

  } catch (error: any) {
    console.error('❌ Discard enhanced image error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
