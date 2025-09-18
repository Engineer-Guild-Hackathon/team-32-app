import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function followUser(request: NextRequest, context: { params: Promise<{ userId: string }> }, userId: string) {
  try {
    const supabase = await createClient();

    const { userId: targetUserId } = await context.params;

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // 既存のフォロー関係を確認
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // フォロー関係を作成
    const { error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: userId,
        following_id: targetUserId,
      });

    if (insertError) {
      console.error('Error following user:', insertError);
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in followUser:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function unfollowUser(request: NextRequest, context: { params: Promise<{ userId: string }> }, userId: string) {
  try {
    const supabase = await createClient();

    const { userId: targetUserId } = await context.params;

    // フォロー関係を削除
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);

    if (deleteError) {
      console.error('Error unfollowing user:', deleteError);
      return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(followUser);
export const DELETE = withAuth(unfollowUser);
