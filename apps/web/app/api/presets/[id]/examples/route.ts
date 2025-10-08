import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: presetId } = await params

    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
    }

    // Create Supabase client with service role key for remote database
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check both preset_images table and media table for examples
    let examples: any[] = [];
    let error: any = null;

    try {
      // Get examples from media table (unverified examples only)
      // We don't want to show verified samples here as they appear in the Samples tab
      console.log('Fetching examples from media table...')
      
      // Get the preset name to match against style in media table
      const { data: presetData, error: presetDataError } = await supabase
        .from('presets')
        .select('name')
        .eq('id', presetId)
        .single()

      if (presetDataError || !presetData) {
        console.log('Preset not found in presets table, trying cinematic_presets...')
        
        // Try cinematic_presets table
        const { data: cinematicPresetData, error: cinematicError } = await supabase
          .from('cinematic_presets')
          .select('name')
          .eq('id', presetId)
          .single()

        if (cinematicError || !cinematicPresetData) {
          console.log('Preset not found in either table, returning empty examples')
          examples = []
        } else {
          console.log('Found cinematic preset:', cinematicPresetData.name)
          // Fetch examples from playground_gallery table where style matches cinematic preset name
          const { data: mediaExamples, error: mediaError } = await supabase
            .from('playground_gallery')
            .select(`
              id,
              image_url,
              width,
              height,
              created_at,
              user_id,
              is_verified,
              verification_timestamp,
              exif_json->generation_metadata->prompt,
              exif_json->generation_metadata->style,
              exif_json->generation_metadata->enhanced_prompt
            `)
            .eq('exif_json->generation_metadata->>style', cinematicPresetData.name.toLowerCase())
            .eq('exif_json->>promoted_from_playground', 'true')
            .not('exif_json->generation_metadata->prompt', 'is', null)
            .order('created_at', { ascending: false })
            .limit(20)

          if (mediaError) {
            console.error('Error fetching media examples:', mediaError)
            examples = []
          } else {
            console.log('Found media examples:', mediaExamples?.length || 0)
            examples = mediaExamples || []
          }
        }
      } else {
        console.log('Found preset:', presetData.name)
        // Fetch examples from playground_gallery table where style matches preset name
        const { data: mediaExamples, error: mediaError } = await supabase
          .from('playground_gallery')
          .select(`
            id,
            image_url,
            width,
            height,
            created_at,
            user_id,
            is_verified,
            verification_timestamp,
            exif_json->generation_metadata->prompt,
            exif_json->generation_metadata->style,
            exif_json->generation_metadata->enhanced_prompt
          `)
          .eq('exif_json->generation_metadata->>style', presetData.name.toLowerCase())
          .eq('exif_json->>promoted_from_playground', 'true')
          .not('exif_json->generation_metadata->prompt', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20)

        if (mediaError) {
          console.error('Error fetching media examples:', mediaError)
          examples = []
        } else {
          console.log('Found media examples:', mediaExamples?.length || 0)
          examples = mediaExamples || []
        }
      }
    } catch (err) {
      console.error('Error fetching preset examples:', err)
      // Return empty examples instead of error to prevent UI issues
      examples = []
    }

    // Format examples from playground_gallery table
    let formattedExamples = examples;

    if (examples.length > 0 && (examples[0].path || examples[0].image_url)) {
      // These are from playground_gallery or media table, need to format them
      formattedExamples = await Promise.all(
        examples?.map(async (example) => {
          // Fetch user profile data separately
          const { data: userProfile } = await supabase
            .from('users_profile')
            .select('id, display_name, handle, avatar_url')
            .eq('user_id', example.user_id || example.owner_user_id)
            .single()

          // Generate a clean title from the prompt
          const generateTitle = (prompt: string) => {
            if (!prompt) return 'Generated Image'

            // Extract the main subject from the prompt
            const subjectMatch = prompt.match(/of\s+([^,]+)/i)
            if (subjectMatch) {
              const subject = subjectMatch[1].trim()
              return `${subject.charAt(0).toUpperCase() + subject.slice(1)}`
            }

            // Fallback to first few words
            const words = prompt.split(' ').slice(0, 4)
            return words.join(' ') + (prompt.split(' ').length > 4 ? '...' : '')
          }

          return {
            id: example.id,
            title: generateTitle(example.prompt || ''),
            prompt: example.enhanced_prompt || example.prompt || 'No prompt available',
            images: [{
              url: example.image_url || example.path,
              width: example.width,
              height: example.height,
              generated_at: example.created_at,
              type: 'image'
            }],
            status: 'generated',
            created_at: example.created_at,
            is_verified: example.is_verified || false,
            verification_timestamp: example.verification_timestamp || null,
            creator: {
              id: userProfile?.id || example.user_id || example.owner_user_id,
              display_name: userProfile?.display_name || 'Unknown',
              handle: userProfile?.handle || 'unknown',
              avatar_url: userProfile?.avatar_url || null
            }
          }
        }) || []
      )
    }

    return NextResponse.json({
      examples: formattedExamples,
      total: formattedExamples.length
    })

  } catch (error) {
    console.error('Error in preset examples API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
