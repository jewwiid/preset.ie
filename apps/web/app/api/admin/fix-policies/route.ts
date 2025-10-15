import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create a function to execute SQL with proper escaping
    const executeSql = async (sql: string) => {
      const { data, error } = await supabase.rpc('exec_raw_sql', {
        sql_query: sql
      })
      return { data, error }
    }

    // First, create the function if it doesn't exist
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_raw_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `

    let funcError;
    try {
      const result = await supabase.rpc('exec_raw_sql', {
        sql_query: createFunctionSql
      });
      funcError = result.error;
    } catch (error) {
      // If function doesn't exist, create it using a different approach
      console.log('Creating exec function via direct query...')
      const result = await supabase.rpc('create_admin_policies');
      funcError = result.error;
    }

    // Now execute the policies
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Admin users can view all applications" ON applications
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM users_profile 
           WHERE user_id = auth.uid() 
           AND 'ADMIN' = ANY(account_type)
         )
       );`,
      `CREATE POLICY IF NOT EXISTS "Admin users can update all applications" ON applications
       FOR UPDATE USING (
         EXISTS (
           SELECT 1 FROM users_profile 
           WHERE user_id = auth.uid() 
           AND 'ADMIN' = ANY(account_type)
         )
       );`
    ]

    for (const policy of policies) {
      const { error } = await executeSql(policy)
      if (error) {
        console.error('Policy error:', error)
      }
    }

    return NextResponse.json({ success: true, message: 'Admin policies processed' })
  } catch (error) {
    console.error('Error adding admin policies:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}