import { NextRequest, NextResponse } from 'next/server';
import { CollaborationNotificationsService } from '@/lib/services/collaboration-notifications.service';

// GET /api/notifications/collaboration - Get collaboration notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const notifications = await CollaborationNotificationsService.getCollaborationNotifications(
      userId,
      limit,
      offset
    );

    const stats = await CollaborationNotificationsService.getNotificationStats(userId);

    return NextResponse.json({
      notifications,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit
      }
    });

  } catch (error) {
    console.error('Collaboration notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications/collaboration - Create collaboration notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, metadata } = body;

    if (!userId || !type) {
      return NextResponse.json({ 
        error: 'User ID and type are required' 
      }, { status: 400 });
    }

    const result = await CollaborationNotificationsService.createNotification(
      userId,
      type,
      metadata
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        notificationId: result.notificationId
      });
    } else {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Create collaboration notification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/collaboration - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notificationIds } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const result = await CollaborationNotificationsService.markNotificationsRead(
      userId,
      notificationIds
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        count: result.count
      });
    } else {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Mark notifications read API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
