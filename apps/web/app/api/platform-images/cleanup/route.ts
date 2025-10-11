import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to clean up orphaned records
    const { data, error } = await supabase.rpc('cleanup_orphaned_platform_images');

    if (error) {
      console.error('Error running cleanup:', error);
      return NextResponse.json({ error: 'Failed to cleanup orphaned images' }, { status: 500 });
    }

    const deletedCount = data || 0;
    console.log(`✅ Cleaned up ${deletedCount} orphaned platform image records`);

    return NextResponse.json({
      success: true,
      deletedCount: deletedCount,
      message: `Successfully cleaned up ${deletedCount} orphaned image records`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cleanup images' },
      { status: 500 }
    );
  }
}
