import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createContainer } from '@preset/application/container'
import { PexelsService } from '@preset/adapters/external/PexelsService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
      urlImages,
      enhancementRequests,
      palette 
    } = await request.json()
    
    // Initialize DI container
    const container = createContainer(supabase, {
      nanoBananaApiKey: process.env.NANOBANANA_API_KEY,
      nanoBananaCallbackUrl: process.env.NANOBANANA_CALLBACK_URL || 
        `${supabaseUrl}/functions/v1/nanobanana-callback`
    })
    
    // Prepare moodboard items
    let items: any[] = []
    
    // 1. Add Pexels images if query provided
    if (pexelsQuery) {
      const pexelsService = new PexelsService(process.env.PEXELS_API_KEY!)
      const pexelsImages = await pexelsService.searchPhotos(pexelsQuery, 6)
      
      items = items.concat(pexelsImages.map((img, index) => ({
        type: 'image' as const,
        url: img.url,
        caption: img.caption,
        source: 'pexels' as const,
        order: index
      })))
    }
    
    // 2. Add URL images
    if (urlImages && urlImages.length > 0) {
      items = items.concat(urlImages.map((url: string, index: number) => ({
        type: 'image' as const,
        url,
        caption: '',
        source: 'url' as const,
        order: items.length + index
      })))
    }
    
    // 3. Add user uploads
    if (userUploadIds && userUploadIds.length > 0) {
      // Fetch upload URLs from storage
      for (const uploadId of userUploadIds) {
        const { data } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(uploadId)
        
        items.push({
          type: 'image' as const,
          url: data.publicUrl,
          caption: '',
          source: 'user-upload' as const,
          order: items.length
        })
      }
    }
    
    // Use the CreateMoodboard use case
    const createMoodboardUseCase = container.getCreateMoodboardUseCase()
    
    const result = await createMoodboardUseCase.execute({
      gigId,
      ownerId: user.id,
      title: title || 'AI Generated Moodboard',
      summary: pexelsQuery 
        ? `A ${pexelsQuery}-inspired mood with ${items.length} carefully curated images`
        : `A creative moodboard with ${items.length} visual elements`,
      items
    })
    
    // Process AI enhancements if requested
    if (enhancementRequests && enhancementRequests.length > 0) {
      const enhanceImageUseCase = container.getEnhanceImageUseCase()
      
      for (const request of enhancementRequests) {
        try {
          await enhanceImageUseCase.execute({
            moodboardId: result.moodboardId,
            imageUrl: request.imageUrl,
            enhancementType: request.enhancementType,
            style: request.style,
            userId: user.id
          })
        } catch (error) {
          console.error('Enhancement failed:', error)
          // Continue with other enhancements
        }
      }
    }
    
    // Get the updated moodboard
    const getMoodboardUseCase = container.getGetMoodboardUseCase()
    const moodboard = await getMoodboardUseCase.execute({
      moodboardId: result.moodboardId
    })
    
    // Return success response
    return NextResponse.json({
      success: true,
      moodboard: {
        id: result.moodboardId,
        title: moodboard ? moodboard.title : title,
        itemCount: items.length,
        totalCost: moodboard ? moodboard.totalCost : 0,
        sourceBreakdown: moodboard ? moodboard.sourceBreakdown : null
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