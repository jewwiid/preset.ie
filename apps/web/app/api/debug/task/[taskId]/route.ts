import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ taskId: string }> }
) {
  try {
    const params = await props.params;
    const { taskId: taskId } = await params;
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get task by api_task_id
    const { data: taskByApiId, error: errorByApiId } = await supabaseAdmin
      .from('enhancement_tasks')
      .select('*')
      .eq('api_task_id', taskId)
      .single();

    // Get task by main id
    const { data: taskById, error: errorById } = await supabaseAdmin
      .from('enhancement_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    return NextResponse.json({
      success: true,
      taskId,
      lookupByApiId: {
        found: !!taskByApiId,
        error: errorByApiId?.message,
        data: taskByApiId
      },
      lookupById: {
        found: !!taskById,
        error: errorById?.message,
        data: taskById
      }
    });

  } catch (error: any) {
    console.error('Debug task error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
