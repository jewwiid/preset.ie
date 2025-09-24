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

    // Since playground_projects has RLS issues, use media table as source for examples
    let examples: any[] = [];
    let error: any = null;

    try {
      // First, get the preset name to match against style in media table
      const { data: presetData, error: presetError } = await supabase
        .from('presets')
        .select('name')
        .eq('id', presetId)
        .single()

      if (presetError || !presetData) {
        console.log('Preset not found, returning empty examples', { presetError, presetData })
        examples = []
      } else {
        console.log('Found preset:', presetData.name)
        // Fetch examples from media table where style matches preset name
        const { data: mediaExamples, error: mediaError } = await supabase
          .from('media')
          .select(`
            id,
            path,
            width,
            height,
            created_at,
            owner_user_id,
            exif_json->generation_metadata->prompt,
            exif_json->generation_metadata->style,
            exif_json->generation_metadata->enhanced_prompt
          `)
          .eq('exif_json->generation_metadata->style', `"${presetData.name.toLowerCase()}"`)
          .eq('exif_json->promoted_from_playground', true)
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

    // Format the examples data from media table
    const formattedExamples = await Promise.all(
      examples?.map(async (example) => {
        // Fetch user profile data separately
        const { data: userProfile } = await supabase
          .from('users_profile')
          .select('id, display_name, handle, avatar_url')
          .eq('id', example.owner_user_id)
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
            url: example.path,
            width: example.width,
            height: example.height,
            generated_at: example.created_at,
            type: 'image'
          }],
          status: 'generated',
          created_at: example.created_at,
          creator: {
            id: userProfile?.id || example.owner_user_id,
            display_name: userProfile?.display_name || 'Unknown',
            handle: userProfile?.handle || 'unknown',
            avatar_url: userProfile?.avatar_url || null
          }
        }
      }) || []
    )

    return NextResponse.json({
      examples: formattedExamples,
      total: formattedExamples.length
    })

  } catch (error) {
    console.error('Error in preset examples API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
