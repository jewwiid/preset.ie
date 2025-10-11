import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST /api/verification/submit - Submit verification using new schema
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    // Extract form data fields
    // @ts-ignore - FormData type issue in build environment
    const verification_type = formData.get('verification_type') as string | null
    // @ts-ignore
    const document_file = formData.get('document_file') as File | null
    // @ts-ignore
    const additional_info = formData.get('additional_info') as string | null
    // @ts-ignore
    const metadataStr = formData.get('metadata') as string | null
    const metadata = JSON.parse(metadataStr || '{}')

    // Validate required fields
    if (!verification_type || !document_file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check current verification status
    const { data: existingSubmission } = await supabase
      .from('verification_submissions')
      .select('status, verification_type')
      .eq('user_id', user.id)
      .single()

    // Prevent submission if already approved or pending
    if (existingSubmission?.status === 'approved') {
      return NextResponse.json({ 
        error: `You already have ${verification_type} verification approved. No need to submit again.` 
      }, { status: 400 })
    }

    if (existingSubmission?.status === 'pending') {
      return NextResponse.json({ 
        error: `You already have a ${verification_type} verification request pending review. Please wait for the current request to be processed.` 
      }, { status: 400 })
    }

    // Upload document to storage
    const fileName = `${user.id}/${verification_type}/${Date.now()}.${document_file.name.split('.').pop()}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, document_file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
    }

    // Create or update verification submission
    const submissionData = {
      user_id: user.id,
      verification_type,
      status: 'pending',
      metadata: {
        ...metadata,
        document_url: uploadData.path,
        file_name: document_file.name,
        file_size: document_file.size,
        additional_info
      },
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // If user has a rejected submission, update it; otherwise create new
    if (existingSubmission?.status === 'rejected') {
      const { error: updateError } = await supabase
        .from('verification_submissions')
        .update(submissionData)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update verification submission' }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase
        .from('verification_submissions')
        .insert(submissionData)

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ error: 'Failed to create verification submission' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification submitted successfully',
      submission_id: user.id // Since user_id is the primary key
    })

  } catch (error: any) {
    console.error('Verification submission error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
