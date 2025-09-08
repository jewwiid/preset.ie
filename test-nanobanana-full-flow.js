/**
 * Test full NanoBanana flow: submit, poll, and save to Supabase
 */

require('dotenv').config({ path: './apps/web/.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const nanoBananaApiKey = process.env.NANOBANANA_API_KEY

if (!supabaseUrl || !supabaseServiceKey || !nanoBananaApiKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFullFlow() {
  try {
    console.log('1. Submitting enhancement task to NanoBanana...')
    
    const enhancementPayload = {
      prompt: 'beautiful sunset beach scene',
      type: 'IMAGETOIAMGE',
      imageUrls: ['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?w=1024'],
      callBackUrl: 'https://webhook.site/unique-id-here', // Test webhook URL
      numImages: 1
    }
    
    const submitResponse = await fetch('https://api.nanobananaapi.ai/api/v1/nanobanana/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nanoBananaApiKey}`
      },
      body: JSON.stringify(enhancementPayload)
    })
    
    if (!submitResponse.ok) {
      const error = await submitResponse.text()
      console.error('Submit failed:', error)
      return
    }
    
    const submitData = await submitResponse.json()
    console.log('Task submitted:', submitData)
    
    if (!submitData.data?.taskId) {
      console.error('No taskId in response')
      return
    }
    
    const taskId = submitData.data.taskId
    console.log('Task ID:', taskId)
    
    // Wait and poll for completion
    console.log('\n2. Polling for task completion...')
    let completed = false
    let resultUrl = null
    let pollCount = 0
    const maxPolls = 30 // 90 seconds max
    
    while (!completed && pollCount < maxPolls) {
      pollCount++
      console.log(`Poll ${pollCount}...`)
      
      // Wait 3 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const statusResponse = await fetch(
        `https://api.nanobananaapi.ai/api/v1/nanobanana/record?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${nanoBananaApiKey}`
          }
        }
      )
      
      if (!statusResponse.ok) {
        console.log('Status check failed:', statusResponse.status, statusResponse.statusText)
        continue
      }
      
      const statusData = await statusResponse.json()
      console.log('Status:', statusData.data?.successFlag, statusData.msg)
      
      if (statusData.data?.successFlag === 1) {
        resultUrl = statusData.data?.response?.resultImageUrl
        if (resultUrl) {
          completed = true
          console.log('✅ Task completed! Result URL:', resultUrl)
        }
      } else if (statusData.data?.successFlag === 2 || statusData.data?.successFlag === 3) {
        console.error('Task failed:', statusData.data?.errorMessage)
        return
      }
    }
    
    if (!resultUrl) {
      console.error('Task did not complete in time')
      return
    }
    
    // Download and save to Supabase
    console.log('\n3. Downloading enhanced image...')
    const imageResponse = await fetch(resultUrl)
    
    if (!imageResponse.ok) {
      console.error('Failed to download image:', imageResponse.status)
      return
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    console.log('Downloaded image size:', imageBuffer.byteLength, 'bytes')
    
    // Upload to Supabase Storage
    console.log('\n4. Uploading to Supabase Storage...')
    const fileName = `test_enhanced_${taskId}_${Date.now()}.jpg`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('moodboard-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload failed:', uploadError)
      return
    }
    
    console.log('✅ Upload successful:', uploadData)
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('moodboard-images')
      .getPublicUrl(fileName)
    
    console.log('✅ Permanent URL:', publicUrl)
    
    // List files to verify
    console.log('\n5. Verifying file in bucket...')
    const { data: files, error: listError } = await supabase
      .storage
      .from('moodboard-images')
      .list()
    
    if (!listError) {
      const ourFile = files.find(f => f.name === fileName)
      if (ourFile) {
        console.log('✅ File verified in bucket:', ourFile.name, ourFile.metadata)
      }
    }
    
    console.log('\n✅ Full flow completed successfully!')
    console.log('Original NanoBanana URL:', resultUrl)
    console.log('Permanent Supabase URL:', publicUrl)
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testFullFlow()