import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

// Manually load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local (from project root)
dotenv.config({ path: path.join(process.cwd(), '../../.env.local') })

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  const { prompt, style, aspectRatio, resolution, consistencyLevel, projectId, maxImages, enableSyncMode, enableBase64Output, customStylePreset } = await request.json()
  
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
    // Calculate credits needed (2 credits per image)
    const creditsNeeded = (maxImages || 1) * 2
    
    // Check user credits
    const { data: userCredits } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${maxImages || 1} image(s).` },
        { status: 403 }
      )
    }
    
    // Enhance prompt with style information
    let stylePrompt: string
    let enhancedPrompt: string
    
    if (customStylePreset) {
      // Use custom style preset
      stylePrompt = customStylePreset.prompt_template.replace('{style_type}', customStylePreset.style_type)
      enhancedPrompt = `${prompt}, ${stylePrompt}`
      
      // Update usage count for the preset
      await supabaseAdmin
        .from('playground_style_presets')
        .update({ usage_count: customStylePreset.usage_count + 1 })
        .eq('id', customStylePreset.id)
    } else {
      // Use default style prompts
      const stylePrompts = {
        'realistic': 'photorealistic, high quality, detailed, natural lighting',
        'artistic': 'artistic style, creative interpretation, painterly, expressive',
        'cartoon': 'cartoon style, animated, colorful, simplified features',
        'anime': 'anime style, manga art, Japanese animation, stylized',
        'fantasy': 'fantasy art, magical, mystical, ethereal, otherworldly'
      }
      
      stylePrompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.realistic
      enhancedPrompt = `${prompt}, ${stylePrompt}`
    }
    
    // Call Seedream API for image generation
    console.log('Calling Seedream API with enhanced prompt:', enhancedPrompt)
    console.log('Style applied:', style, '->', stylePrompt)
    console.log('Consistency level:', consistencyLevel)
    
    // Temporary mock response for testing
    const isTestMode = process.env.NODE_ENV === 'development' && prompt.includes('test')
    let seedreamData
    
    if (isTestMode) {
      console.log('Using mock response for testing')
      seedreamData = {
        code: 200,
        data: {
          outputs: [
            `https://via.placeholder.com/1024x1024/FF6B6B/FFFFFF?text=${encodeURIComponent(style)}-Style-1`,
            `https://via.placeholder.com/1024x1024/4ECDC4/FFFFFF?text=${encodeURIComponent(style)}-Style-2`
          ]
        }
      }
    } else {
      const seedreamResponse = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          size: resolution || '1024*1024',
          max_images: maxImages || 1,
          enable_base64_output: enableBase64Output || false,
          enable_sync_mode: enableSyncMode !== false,
          consistency_level: consistencyLevel || 'high'
        })
      })
      
      console.log('Seedream API response status:', seedreamResponse.status)
      
      if (!seedreamResponse.ok) {
        const errorText = await seedreamResponse.text()
        console.error('Seedream API error response:', errorText)
        throw new Error(`Seedream API error: ${seedreamResponse.status} - ${errorText}`)
      }
      
      const seedreamResponseData = await seedreamResponse.json()
      console.log('Seedream API response data:', seedreamResponseData)
      
      // Handle async response - poll for results
      if (seedreamResponseData.status === 'created' && seedreamResponseData.urls?.get) {
        console.log('Polling for async results...')
        let attempts = 0
        const maxAttempts = 30 // 30 seconds timeout
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
          
          const resultResponse = await fetch(seedreamResponseData.urls.get, {
            headers: {
              'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`
            }
          })
          
          if (!resultResponse.ok) {
            throw new Error(`Failed to fetch results: ${resultResponse.status}`)
          }
          
          const resultData = await resultResponse.json()
          console.log(`Polling attempt ${attempts + 1}:`, resultData)
          
          if (resultData.status === 'succeeded' && resultData.outputs && resultData.outputs.length > 0) {
            // Transform the response to match expected format
            seedreamData = {
              code: 200,
              data: {
                outputs: resultData.outputs.map((output: any) => ({
                  url: output.url || output.image_url || output
                }))
              }
            }
            break
          } else if (resultData.status === 'failed') {
            throw new Error(resultData.error || 'Generation failed')
          }
          
          attempts++
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Generation timeout - please try again')
        }
      } else {
        // Handle direct response (if sync mode actually works)
        seedreamData = seedreamResponseData
      }
    }
    
    // Check if generation was successful
    if (seedreamData.code !== 200 || !seedreamData.data.outputs || seedreamData.data.outputs.length === 0) {
      console.error('Seedream generation failed:', seedreamData)
      throw new Error(seedreamData.message || 'Failed to generate images')
    }
    
    // Deduct credits
    console.log('Deducting credits for user:', user.id)
    const { error: creditError } = await supabaseAdmin
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    if (creditError) {
      console.error('Credit deduction failed:', creditError)
      throw new Error(`Credit deduction failed: ${creditError.message}`)
    }
    console.log('Credits deducted successfully')
    
    // Save or update project
    const projectData = {
      user_id: user.id,
      title: prompt.substring(0, 50),
      prompt, // Store original prompt
      style,
      aspect_ratio: aspectRatio,
      resolution,
      generated_images: seedreamData.data.outputs.map((imgUrl: string, index: number) => ({
        url: imgUrl,
        width: parseInt(resolution?.split('*')[0] || '1024'),
        height: parseInt(resolution?.split('*')[1] || '1024'),
        generated_at: new Date().toISOString()
      })),
      credits_used: creditsNeeded,
      status: 'generated',
      last_generated_at: new Date().toISOString(),
      metadata: {
        enhanced_prompt: enhancedPrompt,
        style_applied: style,
        style_prompt: stylePrompt,
        consistency_level: consistencyLevel || 'high',
        custom_style_preset: customStylePreset ? {
          id: customStylePreset.id,
          name: customStylePreset.name,
          style_type: customStylePreset.style_type
        } : null
      }
    }
    
    let project
    console.log('Saving project data:', { projectId, user_id: user.id })
    
    if (projectId) {
      const { data, error } = await supabaseAdmin
        .from('playground_projects')
        .update(projectData)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) {
        console.error('Project update failed:', error)
        throw new Error(`Project update failed: ${error.message}`)
      }
      project = data
      console.log('Project updated successfully')
    } else {
      const { data, error } = await supabaseAdmin
        .from('playground_projects')
        .insert(projectData)
        .select()
        .single()
      
      if (error) {
        console.error('Project insert failed:', error)
        throw new Error(`Project insert failed: ${error.message}`)
      }
      project = data
      console.log('Project created successfully')
    }
    
    return NextResponse.json({ 
      success: true, 
      project,
      images: seedreamData.data.outputs.map((imgUrl: string) => ({
        url: imgUrl,
        width: parseInt(resolution?.split('*')[0] || '1024'),
        height: parseInt(resolution?.split('*')[1] || '1024')
      })),
      creditsUsed: creditsNeeded
    })
  } catch (error) {
    console.error('Failed to generate images:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate images',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
