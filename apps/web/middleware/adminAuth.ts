import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function isAdmin(request: NextRequest): Promise<{ isValid: boolean; user?: any }> {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return { isValid: false };
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { isValid: false };
    }
    
    // Check if user has admin role
    const { data: profile } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', user.id)
      .single();
    
    if (!profile || !profile.account_type.includes('ADMIN')) {
      return { isValid: false };
    }
    
    return { isValid: true, user };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { isValid: false };
  }
}

export function requireAdmin(handler: Function) {
  return async (request: NextRequest) => {
    const { isValid, user } = await isAdmin(request);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    // Add user to request for handler to use
    (request as any).admin = user;
    return handler(request);
  };
}