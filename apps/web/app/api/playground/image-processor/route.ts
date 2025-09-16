import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, aspectRatio, resolution, yPosition } = await request.json()
    
    if (!imageUrl || !aspectRatio || !resolution) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: imageUrl, aspectRatio, resolution' },
        { status: 400 }
      )
    }

    console.log('🖼️ Processing image:', { imageUrl, aspectRatio, resolution, yPosition })

    // Download the original image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const image = sharp(Buffer.from(imageBuffer))
    
    // Get original image metadata
    const metadata = await image.metadata()
    console.log('📐 Original image metadata:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    })

    // Calculate target dimensions
    const targetDimensions = getTargetDimensions(aspectRatio, resolution)
    console.log('🎯 Target dimensions:', targetDimensions)

    // Calculate crop dimensions and position
    const cropInfo = calculateCropDimensions(
      metadata.width!,
      metadata.height!,
      targetDimensions.width,
      targetDimensions.height,
      yPosition || 0
    )
    
    console.log('✂️ Crop information:', cropInfo)

    // Process the image
    const processedImageBuffer = await image
      .extract({
        left: cropInfo.left,
        top: cropInfo.top,
        width: cropInfo.width,
        height: cropInfo.height
      })
      .resize(targetDimensions.width, targetDimensions.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    // Upload processed image to Supabase storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const fileName = `processed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('playground-images')
      .upload(fileName, processedImageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      throw new Error(`Failed to upload processed image: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('playground-images')
      .getPublicUrl(fileName)

    const processedImageUrl = urlData.publicUrl

    console.log('✅ Image processed successfully:', {
      originalUrl: imageUrl,
      processedUrl: processedImageUrl,
      originalDimensions: `${metadata.width}x${metadata.height}`,
      targetDimensions: `${targetDimensions.width}x${targetDimensions.height}`,
      cropInfo
    })

    return NextResponse.json({
      success: true,
      processedImageUrl,
      originalDimensions: {
        width: metadata.width,
        height: metadata.height
      },
      targetDimensions,
      cropInfo
    })

  } catch (error) {
    console.error('❌ Image processing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Image processing failed' 
      },
      { status: 500 }
    )
  }
}

function getTargetDimensions(aspectRatio: string, resolution: string): { width: number; height: number } {
  const resolutionMap = {
    '480p': { baseWidth: 854, baseHeight: 480 },
    '720p': { baseWidth: 1280, baseHeight: 720 }
  }
  
  const baseDimensions = resolutionMap[resolution as keyof typeof resolutionMap] || resolutionMap['480p']
  
  switch (aspectRatio) {
    case '1:1':
      const size = Math.min(baseDimensions.baseWidth, baseDimensions.baseHeight)
      return { width: size, height: size }
    case '16:9':
      return { width: baseDimensions.baseWidth, height: baseDimensions.baseHeight }
    case '9:16':
      return { width: baseDimensions.baseHeight, height: baseDimensions.baseWidth }
    case '4:3':
      const width43 = baseDimensions.baseWidth
      const height43 = Math.round(width43 * 3 / 4)
      return { width: width43, height: height43 }
    case '3:4':
      const height34 = baseDimensions.baseHeight
      const width34 = Math.round(height34 * 3 / 4)
      return { width: width34, height: height34 }
    default:
      return { width: baseDimensions.baseWidth, height: baseDimensions.baseHeight }
  }
}

function calculateCropDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
  yPosition: number
): { left: number; top: number; width: number; height: number } {
  const originalAspectRatio = originalWidth / originalHeight
  const targetAspectRatio = targetWidth / targetHeight
  
  let cropWidth: number
  let cropHeight: number
  let left: number
  let top: number
  
  if (originalAspectRatio > targetAspectRatio) {
    // Original is wider - crop width
    cropHeight = originalHeight
    cropWidth = Math.round(originalHeight * targetAspectRatio)
    left = Math.round((originalWidth - cropWidth) / 2)
    top = 0
  } else {
    // Original is taller - crop height
    cropWidth = originalWidth
    cropHeight = Math.round(originalWidth / targetAspectRatio)
    left = 0
    top = Math.round((originalHeight - cropHeight) / 2)
  }
  
  // Apply Y position adjustment
  if (yPosition !== 0) {
    const maxTopAdjustment = originalHeight - cropHeight
    const adjustedTop = top + yPosition
    
    // Clamp the adjustment to valid bounds
    top = Math.max(0, Math.min(maxTopAdjustment, adjustedTop))
  }
  
  return { left, top, width: cropWidth, height: cropHeight }
}
