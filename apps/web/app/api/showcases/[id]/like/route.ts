import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: showcaseId } = await params;
  const { action } = await request.json(); // 'like' or 'unlike'

  if (action === 'like') {
    const { error } = await supabase
      .from('showcase_likes')
      .insert({ showcase_id: showcaseId, user_id: user.id });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Error liking showcase:', error);
      return NextResponse.json({ error: 'Failed to like showcase' }, { status: 500 });
    }
  } else if (action === 'unlike') {
    const { error } = await supabase
      .from('showcase_likes')
      .delete()
      .eq('showcase_id', showcaseId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error unliking showcase:', error);
      return NextResponse.json({ error: 'Failed to unlike showcase' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Recalculate likes count
  const { count, error: countError } = await supabase
    .from('showcase_likes')
    .select('*', { count: 'exact' })
    .eq('showcase_id', showcaseId);

  if (countError) {
    console.error('Error counting likes:', countError);
    return NextResponse.json({ error: 'Failed to get likes count' }, { status: 500 });
  }

  return NextResponse.json({ 
    likes_count: count, 
    is_liked_by_user: action === 'like' 
  });
}