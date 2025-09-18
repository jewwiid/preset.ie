import { NextRequest, NextResponse } from 'next/server';
import { MatchingService } from '@/lib/services/matching.service';

// GET /api/collab/matches - Get matches for various contexts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'users_for_role', 'equipment_for_request', 'projects_for_user'
    const targetId = searchParams.get('target_id'); // role_id, gear_request_id, or user_id
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!type || !targetId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: type and target_id' 
      }, { status: 400 });
    }

    let matches = [];

    switch (type) {
      case 'users_for_role':
        matches = await MatchingService.findUsersForRole(targetId, limit);
        break;
      
      case 'equipment_for_request':
        matches = await MatchingService.findEquipmentForGearRequest(targetId, limit);
        break;
      
      case 'projects_for_user':
        matches = await MatchingService.findProjectsForUser(targetId, limit);
        break;
      
      default:
        return NextResponse.json({ 
          error: 'Invalid type. Must be: users_for_role, equipment_for_request, or projects_for_user' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      matches,
      type,
      target_id: targetId,
      count: matches.length
    });

  } catch (error) {
    console.error('Matches API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
