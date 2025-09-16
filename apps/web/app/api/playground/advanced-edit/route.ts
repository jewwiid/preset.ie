import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  console.log('🔍 Advanced Edit API Debug:', {
    authHeader: request.headers.get('Authorization') ? 'Present' : 'Missing',
    contentType: request.headers.get('Content-Type')
  })
  
  const { user, error: authError } = await getUserFromRequest(request)
  
  console.log('🔍 Auth Result:', {
    user: !!user,
    userId: user?.id,
    authError
  })
  
  if (!user) {
    console.log('❌ Unauthorized - no user found')
    return NextResponse.json(
      { error: `Unauthorized: ${authError || 'Authentication failed'}` },
      { status: 401 }
    )
  }
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  const { 
    projectId, 
    imageUrl, 
    editType, 
    editPrompt, 
    strength,
    style,
    maskImage,
    targetSize,
    referenceImage
  } = await request.json()
  
  try {
    // Check credits for advanced editing
    const creditsNeeded = getCreditsForEditType(editType)
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${editType}.` },
        { status: 403 }
      )
    }
    
    // Determine the correct API endpoint based on edit type
    const apiEndpoint = getApiEndpointForEditType(editType)
    
    // Prepare request body based on edit type
    const requestBody = buildRequestBody(editType, {
      imageUrl,
      editPrompt,
      strength,
      style,
      maskImage,
      targetSize,
      referenceImage
    })
    
    // Call appropriate Seedream API
    console.log(`Performing ${editType} edit with prompt:`, requestBody.prompt)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    
    const editResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log(`Seedream ${editType} API response status:`, editResponse.status)
    
    if (!editResponse.ok) {
      const errorText = await editResponse.text()
      console.error(`Seedream ${editType} API error:`, errorText)
      throw new Error(`Seedream ${editType} API error: ${editResponse.status} - ${errorText}`)
    }
    
    const editData = await editResponse.json()
    console.log(`Seedream ${editType} API response:`, editData)
    
    // Check if edit was successful - handle both response formats
    const outputs = editData.outputs || editData.data?.outputs
    if (!outputs || outputs.length === 0) {
      console.error(`Edit failed for ${editType}:`, editData)
      throw new Error(editData.message || editData.error || `Failed to perform ${editType}`)
    }
    
    console.log(`Successfully completed ${editType} edit. Output:`, outputs[0])
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    // Save edit record
    const { data: editRecord } = await supabase
      .from('playground_image_edits')
      .insert({
        project_id: projectId,
        user_id: user.id,
        edit_type: editType,
        edit_prompt: editPrompt,
        original_image_url: imageUrl,
        edited_image_url: outputs[0],
        strength,
        credits_used: creditsNeeded,
        processing_time_ms: Date.now() - new Date().getTime()
      })
      .select()
      .single()
    
    return NextResponse.json({ 
      success: true, 
      editRecord,
      editedImage: outputs[0],
      editType,
      creditsUsed: creditsNeeded
    })
  } catch (error) {
    console.error(`Failed to perform ${editType}:`, error)
    return NextResponse.json({ error: `Failed to perform ${editType}` }, { status: 500 })
  }
}

function getCreditsForEditType(editType: string): number {
  const creditMap: { [key: string]: number } = {
    'enhance': 2,
    'inpaint': 3,
    'outpaint': 3,
    'style_transfer': 2,
    'face_swap': 4,
    'object_removal': 3,
    'background_removal': 2,
    'upscale': 1,
    'color_adjustment': 2,
    'texture_change': 2,
    'lighting_adjustment': 2,
    'perspective_change': 3,
    'composition_change': 3,
    'artistic_filter': 2,
    'age_progression': 3,
    'gender_swap': 4,
    'expression_change': 2
  }
  return creditMap[editType] || 2
}

function getApiEndpointForEditType(editType: string): string {
  // All advanced editing features use the same seedream-v4/edit endpoint
  // The difference is in the prompt and parameters
  return 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit'
}

function buildRequestBody(editType: string, params: any) {
  const baseBody = {
    images: [params.imageUrl],
    enable_base64_output: false,
    enable_sync_mode: true, // Enable for immediate results
    size: "2048*2048"
  }

  // Add reference image for edit types that require it
  if (params.referenceImage && ['face_swap', 'style_transfer', 'gender_swap', 'age_progression'].includes(editType)) {
    baseBody.images.push(params.referenceImage)
  }
  
  // Build optimized prompts for Seedream V4 based on edit type
  let prompt = params.editPrompt
  
  switch (editType) {
    case 'enhance':
      prompt = `Enhance this image by improving sharpness, contrast, and overall visual quality: ${params.editPrompt}. Focus on clarity, detail preservation, and professional appearance.`
      break
    
    case 'inpaint':
      prompt = `Inpaint the following changes: ${params.editPrompt}. Focus on the specific area mentioned, maintain visual consistency, and ensure seamless integration with the existing image.`
      break
    
    case 'outpaint':
      prompt = `Extend the image beyond its current boundaries: ${params.editPrompt}. Maintain visual consistency, lighting, and style. Extend naturally without artifacts.`
      break
    
    case 'style_transfer':
      prompt = `Apply ${params.style || 'artistic'} style to this image: ${params.editPrompt}. Transform the visual style while preserving the original composition and subject matter.`
      break
    
    case 'face_swap':
      prompt = `Replace the face in this image with: ${params.editPrompt}. Maintain natural lighting, proportions, and facial features. Ensure realistic skin tone and expression.`
      break
    
    case 'object_removal':
      prompt = `Remove the following objects from the image: ${params.editPrompt}. Fill the area naturally with appropriate background elements. Maintain lighting and perspective.`
      break
    
    case 'background_removal':
      prompt = `Remove the background from this image, making it transparent or replacing with a clean, simple background. Preserve the main subject perfectly.`
      break
    
    case 'upscale':
      prompt = `Enhance the resolution and quality of this image while maintaining all details and visual fidelity. Improve sharpness and reduce noise.`
      break
    
    case 'color_adjustment':
      prompt = `Adjust the colors of this image: ${params.editPrompt}. Maintain natural appearance and skin tones. Apply color grading professionally.`
      break
    
    case 'texture_change':
      prompt = `Modify the surface textures and materials: ${params.editPrompt}. Change textures while maintaining realistic lighting and material properties.`
      break
    
    case 'lighting_adjustment':
      prompt = `Adjust lighting conditions and atmosphere: ${params.editPrompt}. Modify lighting direction, intensity, and color temperature naturally.`
      break
    
    case 'perspective_change':
      prompt = `Change viewing angle and perspective: ${params.editPrompt}. Modify the camera angle while maintaining realistic proportions and depth.`
      break
    
    case 'composition_change':
      prompt = `Modify image composition and framing: ${params.editPrompt}. Adjust the composition following photographic principles like rule of thirds.`
      break
    
    case 'artistic_filter':
      prompt = `Apply artistic filter and effects: ${params.editPrompt}. Transform the image with artistic style while preserving the main subject.`
      break
    
    case 'age_progression':
      prompt = `Change age appearance realistically: ${params.editPrompt}. Modify facial features, skin texture, and hair while maintaining identity.`
      break
    
    case 'gender_swap':
      prompt = `Transform gender while maintaining identity: ${params.editPrompt}. Change gender characteristics while preserving facial structure and identity.`
      break
    
    case 'expression_change':
      prompt = `Modify facial expressions and emotions: ${params.editPrompt}. Change facial expression while maintaining natural appearance and lighting.`
      break
    
    default:
      prompt = params.editPrompt
  }
  
  return {
    ...baseBody,
    prompt: prompt
  }
}
