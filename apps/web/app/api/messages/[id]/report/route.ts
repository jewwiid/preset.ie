import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { createMessagingContainer } from '@preset/application/collaboration/MessagingContainer';
import { ReportMessageUseCase } from '@preset/application/collaboration/use-cases/ReportMessage';
import { SupabaseMessageReportRepository } from '@preset/adapters/reports/SupabaseMessageReportRepository';

// Validation schema
const ReportMessageSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'harassment', 'scam', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  evidenceUrls: z.array(z.string().url()).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate message ID
    const messageId = params.id;
    if (!messageId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const validation = ReportMessageSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { reason, description, evidenceUrls } = validation.data;

    // Verify the message exists and user has access to it
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, from_user_id, to_user_id, gig_id, body')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is involved in this conversation (either sender or recipient)
    if (message.from_user_id !== user.id && message.to_user_id !== user.id) {
      return NextResponse.json({ error: 'You can only report messages from conversations you are part of' }, { status: 403 });
    }

    // Prevent users from reporting their own messages
    if (message.from_user_id === user.id) {
      return NextResponse.json({ error: 'You cannot report your own messages' }, { status: 400 });
    }

    // Create messaging container and report repository
    const container = createMessagingContainer(supabase);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const reportRepository = new SupabaseMessageReportRepository(supabaseUrl, supabaseServiceKey);
    
    const reportUseCase = new ReportMessageUseCase(
      reportRepository,
      container.getEventBus(),
      container.getIdGenerator()
    );

    // Execute the report use case
    const result = await reportUseCase.execute({
      reporterId: user.id,
      messageId,
      reason,
      description,
      evidenceUrls
    });

    return NextResponse.json({
      success: true,
      reportId: result.reportId,
      status: result.status,
      priority: result.priority,
      message: 'Thank you for your report. We will review it and take appropriate action if necessary.'
    });

  } catch (error) {
    console.error('Failed to report message:', error);
    
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('already reported')) {
        return NextResponse.json(
          { error: 'You have already reported this message' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('characters')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to submit report. Please try again.' },
      { status: 500 }
    );
  }
}