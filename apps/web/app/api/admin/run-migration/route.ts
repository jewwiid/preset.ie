import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check for admin auth token
    const authToken = request.headers.get('x-admin-token')
    if (!authToken || authToken !== process.env.ADMIN_MIGRATION_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const migrationSQL = `
-- Create refund policies table
CREATE TABLE IF NOT EXISTS refund_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code TEXT UNIQUE NOT NULL,
    error_type TEXT NOT NULL,
    should_refund BOOLEAN DEFAULT true,
    refund_percentage INTEGER DEFAULT 100 CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create credit refunds table (refund audit log)
CREATE TABLE IF NOT EXISTS credit_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    credits_refunded INTEGER NOT NULL CHECK (credits_refunded > 0),
    platform_credits_lost INTEGER DEFAULT 0,
    refund_reason TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
`

    // Execute migration using Supabase RPC or direct SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('Migration error:', error)
      // Try alternative approach using individual queries
      return await runMigrationStepByStep()
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      data
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function runMigrationStepByStep() {
  try {
    // Since Supabase doesn't allow direct SQL execution via REST API,
    // we need to use the SQL Editor in Supabase Dashboard
    return NextResponse.json({
      success: false,
      message: 'Please run the migration manually in Supabase SQL Editor',
      instructions: [
        '1. Go to Supabase Dashboard > SQL Editor',
        '2. Run the SQL from: apps/web/supabase-migrations/create_refund_tables.sql',
        '3. Refresh the admin page'
      ],
      sqlFile: 'apps/web/supabase-migrations/create_refund_tables.sql'
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to provide migration instructions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
