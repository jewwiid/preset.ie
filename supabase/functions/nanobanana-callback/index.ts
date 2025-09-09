import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // This is a webhook endpoint - no auth required
  // NanoBanana needs to be able to POST without authentication

  try {
    const payload = await req.json()
    console.log('NanoBanana callback received:', JSON.stringify(payload, null, 2))

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { code, data, msg } = payload
    const taskId = data?.taskId

    if (!taskId) {
      console.error('No taskId in callback payload')
      return new Response(JSON.stringify({ success: false, error: 'No taskId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 to prevent retries
      })
    }

    // Get the task from database
    const { data: task, error: taskError } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .or(`id.eq.${taskId},api_task_id.eq.${taskId}`)
      .single()

    if (!task) {
      console.error('Task not found:', taskId)
      return new Response(JSON.stringify({ success: false, error: 'Task not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.log('Found task:', task.id, 'Status:', task.status)

    // Update task based on callback status
    if (code === 200 && data?.info?.resultImageUrl) {
      const resultUrl = data.info.resultImageUrl
      console.log('Enhancement successful! Result URL:', resultUrl)

      // Download and store the image
      try {
        const imageResponse = await fetch(resultUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download: ${imageResponse.status}`)
        }

        const imageBuffer = await imageResponse.arrayBuffer()
        const fileName = `enhanced_${taskId}_${Date.now()}.jpg`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('moodboard-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (uploadError) {
          console.error('Failed to store image:', uploadError)
          throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('moodboard-images')
          .getPublicUrl(fileName)

        // Update task with success
        await supabase
          .from('enhancement_tasks')
          .update({
            status: 'completed',
            result_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)

        console.log('Task completed successfully:', taskId)
      } catch (error) {
        console.error('Failed to download/store image:', error)
        
        // Still mark as completed but use original URL
        await supabase
          .from('enhancement_tasks')
          .update({
            status: 'completed',
            result_url: resultUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)
      }
    } else if (code === 400) {
      // Content policy violation
      await supabase
        .from('enhancement_tasks')
        .update({
          status: 'failed',
          error_message: 'Content policy violation',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      // Refund credit
      await refundCredit(supabase, task.user_id)
    } else {
      // Other error
      await supabase
        .from('enhancement_tasks')
        .update({
          status: 'failed',
          error_message: msg || 'Enhancement failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      // Refund credit
      await refundCredit(supabase, task.user_id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Callback processing error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})

async function refundCredit(supabase: any, userId: string) {
  try {
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single()

    if (userCredits) {
      await supabase
        .from('user_credits')
        .update({
          current_balance: userCredits.current_balance + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'refund',
          credits_used: -1,
          provider: 'nanobanana',
          status: 'completed',
          created_at: new Date().toISOString()
        })

      console.log('Credit refunded for user:', userId)
    }
  } catch (error) {
    console.error('Failed to refund credit:', error)
  }
}