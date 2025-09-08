import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createPexelsClient } from 'pexels'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U'

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Initialize Supabase with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    // Get user's profile and subscription tier
    let { data: profile } = await supabase
      .from('users_profile')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()
    
    if (!profile) {
      // Create default profile if not exists
      const { data: newProfile, error: createError } = await supabase
        .from('users_profile')
        .insert({
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'User',
          subscription_tier: 'free'
        })
        .select()
        .single()
      
      if (createError || !newProfile) {
        return NextResponse.json(
          { success: false, error: 'Failed to create profile' },
          { status: 500 }
        )
      }
      
      profile = {
        id: newProfile.id,
        subscription_tier: 'free'
      }
    }
    
    // Parse request body
    const { 
      gigId, 
      title, 
      pexelsQuery, 
      userUploadIds, 
      enhancementRequests,
      palette 
    } = await request.json()
    
    // Get subscription limits
    const subscriptionLimits: Record<string, any> = {
      free: { aiEnhancements: 0, userUploads: 0 },
      FREE: { aiEnhancements: 0, userUploads: 0 },
      plus: { aiEnhancements: 2, userUploads: 3 },
      PLUS: { aiEnhancements: 2, userUploads: 3 },
      pro: { aiEnhancements: 4, userUploads: 6 },
      PRO: { aiEnhancements: 4, userUploads: 6 }
    }
    
    const tier = profile.subscription_tier || 'free'
    const limits = subscriptionLimits[tier] || subscriptionLimits.free
    
    // Validate enhancement requests against limits
    if (enhancementRequests && enhancementRequests.length > limits.aiEnhancements) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Enhancement limit exceeded. ${tier} tier allows ${limits.aiEnhancements} enhancements.` 
        },
        { status: 400 }
      )
    }
    
    let moodboardItems: any[] = []
    let totalCost = 0
    let sourceBreakdown = {
      pexels: 0,
      user_upload: userUploadIds?.length || 0,
      ai_enhanced: 0,
      ai_generated: 0
    }
    
    // 1. Add Pexels images if query provided
    if (pexelsQuery) {
      try {
        const pexelsClient = createPexelsClient(process.env.PEXELS_API_KEY!)
        const response = await pexelsClient.photos.search({
          query: pexelsQuery,
          per_page: 6
        })
        
        if ('photos' in response) {
          response.photos.forEach((image: any, index: number) => {
            moodboardItems.push({
              id: crypto.randomUUID(),
              type: 'image',
              source: 'pexels',
              url: image.src.large2x,
              thumbnail_url: image.src.medium,
              caption: image.alt,
              width: image.width,
              height: image.height,
              photographer: image.photographer,
              photographer_url: image.photographer_url,
              position: index
            })
            sourceBreakdown.pexels++
          })
        }
      } catch (error) {
        console.error('Pexels search failed:', error)
        // Continue without Pexels images
      }
    }
    
    // 2. Process AI enhancements (mock for now)
    const enhancementLog: any[] = []
    
    if (enhancementRequests && enhancementRequests.length > 0) {
      for (const request of enhancementRequests) {
        // Mock enhancement - in production, call NanoBanana API
        const enhancedItem = {
          id: crypto.randomUUID(),
          type: 'image' as const,
          source: 'ai-enhanced' as const,
          url: moodboardItems.find(item => item.id === request.imageId)?.url || '',
          thumbnail_url: moodboardItems.find(item => item.id === request.imageId)?.thumbnail_url || '',
          caption: `AI Enhanced: ${request.enhancementType}`,
          position: moodboardItems.length,
          enhancement_prompt: request.prompt || `Apply ${request.enhancementType} enhancement`,
          original_image_id: request.imageId,
          cost: 0.025
        }
        
        moodboardItems.push(enhancedItem)
        sourceBreakdown.ai_enhanced++
        totalCost += 0.025
        
        enhancementLog.push({
          original_id: request.imageId,
          enhanced_id: enhancedItem.id,
          type: request.enhancementType,
          prompt: enhancedItem.enhancement_prompt,
          cost: 0.025,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    // 3. Generate vibe summary
    const vibeSummary = pexelsQuery 
      ? `A ${pexelsQuery}-inspired mood with ${moodboardItems.length} carefully curated images`
      : `A creative moodboard with ${moodboardItems.length} visual elements`
    
    // 4. Create the moodboard in database
    const { data: moodboard, error: createError } = await supabase
      .from('moodboards')
      .insert({
        owner_user_id: profile.id,
        gig_id: gigId,
        title: title || 'AI Generated Moodboard',
        description: `Generated with ${sourceBreakdown.pexels} stock photos and ${sourceBreakdown.ai_enhanced} AI enhancements`,
        vibe_summary: vibeSummary,
        palette: palette || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        items: moodboardItems,
        is_public: false
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Failed to create moodboard:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to save moodboard' },
        { status: 500 }
      )
    }
    
    // 5. Return success response
    return NextResponse.json({
      success: true,
      moodboard: {
        id: moodboard.id,
        title: moodboard.title,
        itemCount: moodboardItems.length,
        totalCost: totalCost,
        sourceBreakdown: sourceBreakdown
      }
    })
    
  } catch (error: any) {
    console.error('Generate moodboard error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

