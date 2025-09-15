import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function GET(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const batchJobId = searchParams.get('batchJobId')
  
  try {
    if (!batchJobId) {
      return NextResponse.json({ error: 'Batch job ID is required' }, { status: 400 })
    }

    // Get batch job status
    const { data: batchJob, error } = await supabase
      .from('playground_batch_jobs')
      .select('*')
      .eq('id', batchJobId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      throw new Error('Failed to fetch batch job status')
    }

    return NextResponse.json({ 
      success: true, 
      batchJob,
      progress: {
        percentage: batchJob.progress_percentage,
        processed: batchJob.processed_items,
        total: batchJob.total_items,
        failed: batchJob.failed_items
      }
    })
  } catch (error) {
    console.error('Failed to get batch status:', error)
    return NextResponse.json({ error: 'Failed to get batch status' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  const { batchJobId, action } = await request.json()
  
  try {
    if (!batchJobId || !action) {
      return NextResponse.json({ error: 'Batch job ID and action are required' }, { status: 400 })
    }

    let updateData: any = {}
    
    switch (action) {
      case 'cancel':
        updateData = { 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        }
        break
      case 'retry':
        updateData = { 
          status: 'pending',
          processed_items: 0,
          failed_items: 0,
          progress_percentage: 0,
          started_at: null,
          completed_at: null
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('playground_batch_jobs')
      .update(updateData)
      .eq('id', batchJobId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update batch job')
    }

    return NextResponse.json({ 
      success: true, 
      batchJob: data 
    })
  } catch (error) {
    console.error('Failed to update batch job:', error)
    return NextResponse.json({ error: 'Failed to update batch job' }, { status: 500 })
  }
}
