import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🔄 Starting showcase dimensions update...')
    
    // Get all showcases that have individual_image_url but no dimensions
    const { data: showcases, error: showcasesError } = await supabase
      .from('showcases')
      .select('id, individual_image_url, individual_image_width, individual_image_height')
      .not('individual_image_url', 'is', null)
      .or('individual_image_width.is.null,individual_image_height.is.null')
    
    if (showcasesError) {
      console.error('❌ Error fetching showcases:', showcasesError)
      return NextResponse.json({ error: 'Failed to fetch showcases' }, { status: 500 })
    }
    
    console.log(`📊 Found ${showcases?.length || 0} showcases to update`)
    
    if (!showcases || showcases.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No showcases need updating',
        updated: 0
      })
    }
    
    let updatedCount = 0
    let errorCount = 0
    
    // Process each showcase
    for (const showcase of showcases) {
      try {
        console.log(`🔍 Processing showcase ${showcase.id} with URL: ${showcase.individual_image_url}`)
        
        // Find the corresponding gallery item
        const { data: galleryItem, error: galleryError } = await supabase
          .from('playground_gallery')
          .select('width, height')
          .eq('image_url', showcase.individual_image_url)
          .single()
        
        if (galleryError || !galleryItem) {
          console.log(`⚠️ No gallery item found for showcase ${showcase.id}`)
          errorCount++
          continue
        }
        
        // Update the showcase with dimensions
        const { error: updateError } = await supabase
          .from('showcases')
          .update({
            individual_image_width: galleryItem.width,
            individual_image_height: galleryItem.height
          })
          .eq('id', showcase.id)
        
        if (updateError) {
          console.error(`❌ Error updating showcase ${showcase.id}:`, updateError)
          errorCount++
        } else {
          console.log(`✅ Updated showcase ${showcase.id} with dimensions: ${galleryItem.width}×${galleryItem.height}`)
          updatedCount++
        }
        
      } catch (error) {
        console.error(`❌ Error processing showcase ${showcase.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`🎉 Update complete! Updated: ${updatedCount}, Errors: ${errorCount}`)
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} showcases, ${errorCount} errors`,
      updated: updatedCount,
      errors: errorCount,
      total: showcases.length
    })
    
  } catch (error) {
    console.error('❌ Error in update showcase dimensions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
