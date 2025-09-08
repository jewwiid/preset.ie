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
    const taskId = params.taskId;
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }

    // Check if auth is required (optional for public testing)
    const authHeader = request.headers.get('Authorization');
    
    // Create admin client to check task status
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get task from database
    const { data: task, error: taskError } = await supabaseAdmin
      .from('enhancement_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError && taskError.code === 'PGRST116') {
      // Task not found - it might not be in the database yet
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'Task is being processed'
      });
    }

    if (taskError) {
      console.error('Error fetching task:', taskError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch task status' },
        { status: 500 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Return task status
    return NextResponse.json({
      success: true,
      status: task.status,
      resultUrl: task.result_url,
      error: task.error_message,
      enhancementType: task.enhancement_type,
      prompt: task.prompt,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}