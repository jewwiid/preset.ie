import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

/**
 * Cleanup API for removing unused preset images
 * This endpoint can be called periodically to clean up orphaned images
 */
export async function POST(request: NextRequest) {
  try {
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

    // Check if the user is an admin (optional - you might want to restrict this)
    const { data: profile } = await supabaseAdmin
      .from('users_profile')
      .select('role')
      .eq('user_id', user.id)
      .single()

    // For now, allow any authenticated user to clean up their own preset images
    // You can add admin-only logic here if needed

    // Find orphaned preset images (images that reference non-existent presets)
    const { data: orphanedImages, error: orphanedError } = await supabaseAdmin
      .from('preset_images')
      .select('id, preset_id, image_url')
      .not('preset_id', 'in', `(SELECT id FROM presets)`)

    if (orphanedError) {
      console.error('Error finding orphaned images:', orphanedError)
      return NextResponse.json(
        { error: 'Failed to find orphaned images' },
        { status: 500 }
      )
    }

    // Find preset images that belong to deleted presets
    const { data: deletedPresetImages, error: deletedError } = await supabaseAdmin
      .from('preset_images')
      .select('id, preset_id, image_url')
      .eq('preset_id', '00000000-0000-0000-0000-000000000000') // This won't match anything, but shows the pattern

    if (deletedError) {
      console.error('Error finding deleted preset images:', deletedError)
    }

    // For user-specific cleanup, only clean up images from presets that belong to the user
    const { data: userPresetImages, error: userImagesError } = await supabaseAdmin
      .from('preset_images')
      .select(`
        id,
        preset_id,
        image_url,
        presets!inner(user_id)
      `)
      .eq('presets.user_id', user.id)

    if (userImagesError) {
      console.error('Error finding user preset images:', userImagesError)
      return NextResponse.json(
        { error: 'Failed to find user preset images' },
        { status: 500 }
      )
    }

    // Find images that reference non-existent presets for this user
    const userPresetIds = userPresetImages?.map(img => img.preset_id) || []
    const orphanedUserImages = userPresetImages?.filter(img => 
      !userPresetIds.includes(img.preset_id)
    ) || []

    // Delete orphaned images
    const imagesToDelete = [...(orphanedImages || []), ...orphanedUserImages]
    
    if (imagesToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('preset_images')
        .delete()
        .in('id', imagesToDelete.map(img => img.id))

      if (deleteError) {
        console.error('Error deleting orphaned images:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete orphaned images' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${imagesToDelete.length} orphaned preset images`,
      deleted_count: imagesToDelete.length,
      deleted_images: imagesToDelete.map(img => ({
        id: img.id,
        preset_id: img.preset_id,
        image_url: img.image_url
      }))
    })
    
  } catch (error) {
    console.error('Failed to cleanup preset images:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to cleanup images'
    }, { status: 500 })
  }
}

/**
 * Get statistics about preset images
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get total count of preset images
    const { count: totalImages, error: totalError } = await supabaseAdmin
      .from('preset_images')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error counting total images:', totalError)
    }

    // Get count of images by type
    const { data: typeStats, error: typeError } = await supabaseAdmin
      .from('preset_images')
      .select('image_type')
      .order('image_type')

    if (typeError) {
      console.error('Error getting type stats:', typeError)
    }

    const typeCounts = typeStats?.reduce((acc, img) => {
      acc[img.image_type] = (acc[img.image_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get count of images per preset
    const { data: presetStats, error: presetError } = await supabaseAdmin
      .from('preset_images')
      .select('preset_id')
      .order('preset_id')

    if (presetError) {
      console.error('Error getting preset stats:', presetError)
    }

    const presetCounts = presetStats?.reduce((acc, img) => {
      acc[img.preset_id] = (acc[img.preset_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const presetsWithImages = Object.keys(presetCounts).length
    const avgImagesPerPreset = presetsWithImages > 0 ? (totalImages || 0) / presetsWithImages : 0

    return NextResponse.json({
      success: true,
      statistics: {
        total_images: totalImages || 0,
        before_images: typeCounts.before || 0,
        after_images: typeCounts.after || 0,
        presets_with_images: presetsWithImages,
        average_images_per_preset: Math.round(avgImagesPerPreset * 100) / 100,
        preset_counts: Object.entries(presetCounts).map(([presetId, count]) => ({
          preset_id: presetId,
          image_count: count
        }))
      }
    })
    
  } catch (error) {
    console.error('Failed to get preset image statistics:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    }, { status: 500 })
  }
}
