import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(request: NextRequest) {
  console.log('Update gallery item API called')
  
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Create two clients: one for user auth, one for admin operations
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Set the user's session to verify the token
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { itemId, description, title, tags } = await request.json()
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {}

    if (description !== undefined) updateData.description = description
    if (title !== undefined) updateData.title = title
    if (tags !== undefined) updateData.tags = tags

    // Try to add updated_at column, but handle gracefully if it doesn't exist
    try {
      updateData.updated_at = new Date().toISOString()
    } catch (e) {
      console.log('Note: updated_at column may not exist yet')
    }

    console.log('Update data being sent:', updateData)

    // Update the gallery item
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('playground_gallery')
      .update(updateData)
      .eq('id', itemId)
      .eq('user_id', user.id) // Ensure user can only update their own items
      .select()
      .single()
    
    // If the update fails due to missing updated_at column, try without it
    if (updateError && updateError.message?.includes('updated_at')) {
      console.log('Retrying update without updated_at column...')
      delete updateData.updated_at
      
      const { data: retryUpdatedItem, error: retryError } = await supabaseAdmin
        .from('playground_gallery')
        .update(updateData)
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (retryError) {
        console.error('Error updating gallery item (retry):', retryError)
        throw retryError
      }
      
      console.log('Successfully updated gallery item (without updated_at):', retryUpdatedItem)
      
      return NextResponse.json({ 
        success: true, 
        item: retryUpdatedItem
      })
    }
    
    if (updateError) {
      console.error('Error updating gallery item:', updateError)
      throw updateError
    }
    
    console.log('Successfully updated gallery item:', updatedItem)
    
    return NextResponse.json({ 
      success: true, 
      item: updatedItem
    })
  } catch (error) {
    console.error('Failed to update gallery item:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update gallery item'
    }, { status: 500 })
  }
}
