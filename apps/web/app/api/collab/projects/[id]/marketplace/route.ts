import { NextRequest, NextResponse } from 'next/server';
import { ProjectMarketplaceService } from '@/lib/services/project-marketplace.service';

// GET /api/collab/projects/[id]/marketplace - Get project marketplace integration data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get gear requests with matching listings
    const gearRequestsWithMatches = await ProjectMarketplaceService.getGearRequestsWithMatches(id);

    // Get project marketplace statistics
    const stats = await ProjectMarketplaceService.getProjectMarketplaceStats(id);

    return NextResponse.json({
      gearRequestsWithMatches,
      stats
    });

  } catch (error) {
    console.error('Project marketplace API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collab/projects/[id]/marketplace/convert - Convert gear request to listing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { gearRequestId, listingData } = body;

    if (!gearRequestId || !listingData) {
      return NextResponse.json({ 
        error: 'Missing required fields: gearRequestId and listingData' 
      }, { status: 400 });
    }

    const result = await ProjectMarketplaceService.convertGearRequestToListing(
      gearRequestId,
      listingData
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        listingId: result.listingId 
      });
    } else {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Convert gear request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/collab/projects/[id]/marketplace/link - Link gear request to existing listing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { gearRequestId, listingId } = body;

    if (!gearRequestId || !listingId) {
      return NextResponse.json({ 
        error: 'Missing required fields: gearRequestId and listingId' 
      }, { status: 400 });
    }

    const result = await ProjectMarketplaceService.linkGearRequestToListing(
      gearRequestId,
      listingId
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Link gear request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
