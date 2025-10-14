import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can view NSFW content
    const { data: result, error: functionError } = await supabase
      .rpc('can_view_nsfw_content', { p_user_id: user.id });

    if (functionError) {
      console.error('Function error:', functionError);
      return NextResponse.json({ error: 'Failed to check NSFW access' }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('NSFW consent check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, show_nsfw_content } = body;

    if (action === 'give_consent') {
      // Give NSFW consent (requires age verification)
      const { data: result, error: functionError } = await supabase
        .rpc('give_nsfw_consent', { p_user_id: user.id });

      if (functionError) {
        console.error('Function error:', functionError);
        return NextResponse.json({ error: 'Failed to give NSFW consent' }, { status: 500 });
      }

      if (!result) {
        return NextResponse.json({ 
          error: 'Age verification required. You must be 18 or older to view NSFW content.',
          needs_age_verification: true
        }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        nsfw_consent_given: true,
        show_nsfw_content: true,
        message: 'NSFW consent granted'
      });

    } else if (action === 'toggle_nsfw') {
      // Toggle NSFW content visibility (requires existing consent)
      if (typeof show_nsfw_content !== 'boolean') {
        return NextResponse.json({ error: 'show_nsfw_content must be a boolean' }, { status: 400 });
      }

      // Check if user has given consent
      const { data: consentCheck, error: consentError } = await supabase
        .rpc('can_view_nsfw_content', { p_user_id: user.id });

      if (consentError) {
        console.error('Consent check error:', consentError);
        return NextResponse.json({ error: 'Failed to check NSFW consent' }, { status: 500 });
      }

      if (!consentCheck.nsfw_consent_given) {
        return NextResponse.json({ 
          error: 'NSFW consent required',
          needs_nsfw_consent: true
        }, { status: 403 });
      }

      // Update NSFW content visibility preference
      const { error: updateError } = await supabase
        .from('user_content_preferences')
        .upsert({
          user_id: user.id,
          show_nsfw_content: show_nsfw_content,
          blur_nsfw_content: !show_nsfw_content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({ error: 'Failed to update NSFW preferences' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        show_nsfw_content: show_nsfw_content,
        blur_nsfw_content: !show_nsfw_content,
        message: `NSFW content ${show_nsfw_content ? 'enabled' : 'disabled'}`
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('NSFW consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
