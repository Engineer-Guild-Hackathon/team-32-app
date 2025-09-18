import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function toggleLike(request: NextRequest, context: { params: Promise<{ postId: string }> }, userId: string) {
  try {
    const supabase = await createClient();

    const { postId } = await context.params;

    // 既存のいいねを確認
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (existingLike) {
      // いいねを削除
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 });
      }

      return NextResponse.json({ liked: false });
    } else {
      // いいねを追加
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          post_id: postId,
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        return NextResponse.json({ error: 'Failed to add like' }, { status: 500 });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error in toggleLike:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(toggleLike);
