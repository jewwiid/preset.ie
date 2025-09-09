import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '../../../../middleware/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Note: Check both possible env var names (typo in original)
const nanoBananaApiKey = process.env.NANOBANANA_API_KEY || process.env.NANOBANA_API_KEY || 'e0847916744535b2241e366dbca9a465';

// GET /api/admin/sync-credits - Fetch real credits from providers and sync with database
export async function GET(request: NextRequest) {
  const { isValid, user } = await isAdmin(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'all';
    
    const syncResults = [];
    
    // Sync NanoBanana credits
    if (provider === 'all' || provider === 'nanobanana') {
      const nanoBananaResult = await syncNanoBananaCredits(supabase);
      syncResults.push(nanoBananaResult);
    }
    
    // Future: Add other providers here
    // if (provider === 'all' || provider === 'openai') {
    //   const openAIResult = await syncOpenAICredits(supabase);
    //   syncResults.push(openAIResult);
    // }
    
    return NextResponse.json({
      success: true,
      synced: syncResults,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error syncing credits:', error);
    return NextResponse.json(
      { error: 'Failed to sync credits', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/sync-credits - Force sync and update database
export async function POST(request: NextRequest) {
  const { isValid, user } = await isAdmin(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const { provider = 'nanobanana', forceUpdate = false } = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let result;
    
    switch (provider) {
      case 'nanobanana':
        result = await syncNanoBananaCredits(supabase, forceUpdate);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully synced ${provider} credits`
    });
  } catch (error: any) {
    console.error('Error in POST sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync credits', details: error.message },
      { status: 500 }
    );
  }
}

async function syncNanoBananaCredits(supabase: any, forceUpdate: boolean = false) {
  try {
    console.log('Fetching real NanoBanana credits...');
    
    // Call NanoBanana API to get actual credit balance
    const response = await fetch('https://api.nanobananaapi.ai/api/v1/common/credit', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nanoBananaApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NanoBanana API error: ${response.status} - ${errorText}`);
    }
    
    const creditData = await response.json();
    console.log('NanoBanana API response:', creditData);
    
    // Extract the actual credit balance
    // According to docs: { "code": 200, "msg": "success", "data": 100 }
    const actualCredits = creditData.data || 0;
    
    // Get current database record
    const { data: currentRecord } = await supabase
      .from('platform_credits')
      .select('*')
      .eq('provider', 'nanobanana')
      .single();
    
    // Calculate consumption if we have a previous balance
    let consumed = 0;
    if (currentRecord && currentRecord.last_api_balance) {
      consumed = Math.max(0, currentRecord.last_api_balance - actualCredits);
    }
    
    // Update database with real credits
    const { data: updated, error } = await supabase
      .from('platform_credits')
      .update({
        current_balance: actualCredits,
        last_api_balance: actualCredits,
        last_sync_at: new Date().toISOString(),
        total_consumed: currentRecord ? currentRecord.total_consumed + consumed : 0,
        metadata: {
          ...currentRecord?.metadata,
          last_api_response: creditData,
          sync_history: [
            ...(currentRecord?.metadata?.sync_history || []).slice(-9), // Keep last 10 syncs
            {
              timestamp: new Date().toISOString(),
              credits: actualCredits,
              consumed: consumed
            }
          ]
        }
      })
      .eq('provider', 'nanobanana')
      .select()
      .single();
    
    if (error) throw error;
    
    // Check if credits are low and send alert
    if (actualCredits < (currentRecord?.low_balance_threshold || 100)) {
      console.warn(`⚠️ NanoBanana credits LOW: ${actualCredits} credits remaining`);
      
      // Log low balance alert
      await supabase
        .from('platform_alerts')
        .insert({
          alert_type: 'low_credits',
          provider: 'nanobanana',
          severity: actualCredits < 50 ? 'critical' : 'warning',
          message: `NanoBanana credits are low: ${actualCredits} remaining`,
          metadata: { current_balance: actualCredits, threshold: currentRecord?.low_balance_threshold },
          created_at: new Date().toISOString()
        });
    }
    
    return {
      provider: 'nanobanana',
      realCredits: actualCredits,
      previousCredits: currentRecord?.current_balance || 0,
      consumed: consumed,
      isLow: actualCredits < (currentRecord?.low_balance_threshold || 100),
      lastSync: new Date().toISOString(),
      userCreditsAvailable: Math.floor(actualCredits / 4) // 1 user credit = 4 NanoBanana credits
    };
    
  } catch (error: any) {
    console.error('Error syncing NanoBanana credits:', error);
    
    // Still return current database values on error
    const { data: fallback } = await supabase
      .from('platform_credits')
      .select('*')
      .eq('provider', 'nanobanana')
      .single();
    
    return {
      provider: 'nanobanana',
      error: error.message,
      realCredits: null,
      databaseCredits: fallback?.current_balance || 0,
      lastSync: fallback?.last_sync_at || null,
      userCreditsAvailable: Math.floor((fallback?.current_balance || 0) / 4)
    };
  }
}

// Webhook endpoint for automatic low balance alerts
export async function PUT(request: NextRequest) {
  const { isValid } = await isAdmin(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const { enableAutoSync, syncInterval = 3600000 } = await request.json(); // Default 1 hour
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update auto-sync settings
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        key: 'credit_auto_sync',
        value: {
          enabled: enableAutoSync,
          interval_ms: syncInterval,
          providers: ['nanobanana'],
          last_run: null
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: `Auto-sync ${enableAutoSync ? 'enabled' : 'disabled'}`,
      syncInterval: syncInterval
    });
  } catch (error: any) {
    console.error('Error updating auto-sync settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}