import { NextRequest, NextResponse } from 'next/server';
import { 
  PlunkCampaignsService,
  CampaignTargeting,
  CampaignContent 
} from '@/lib/services/plunk-campaigns.service';

/**
 * POST /api/campaigns/create
 * Create and send targeted email campaigns via Plunk
 * 
 * Security: This endpoint should be protected - only admins should create campaigns
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const { user } = await getSession();
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { name, targeting, content, sendNow, testEmails } = body;

    // Validate required fields
    if (!name || !content || !content.subject || !content.body) {
      return NextResponse.json(
        { error: 'Missing required fields: name, content.subject, content.body' },
        { status: 400 }
      );
    }

    // Validate targeting criteria
    if (!targeting || Object.keys(targeting).length === 0) {
      return NextResponse.json(
        { error: 'At least one targeting criterion is required' },
        { status: 400 }
      );
    }

    const campaignsService = new PlunkCampaignsService();

    // Create and optionally send campaign
    const result = await campaignsService.createCampaign({
      name,
      targeting: targeting as CampaignTargeting,
      content: content as CampaignContent,
      sendNow: sendNow || false,
      testEmails: testEmails || []
    });

    return NextResponse.json({
      success: true,
      campaignId: result.id,
      recipientCount: result.recipientCount,
      status: sendNow ? 'sent' : 'draft',
      message: sendNow 
        ? `Campaign sent to ${result.recipientCount} recipients`
        : `Campaign created as draft with ${result.recipientCount} recipients`
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

