import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function getUserProfile(request: NextRequest, context: { params: Promise<{ userId: string }> }, userId: string) {
  try {
    const supabase = await createClient();

    const { userId: targetUserId } = await context.params;

    // プロフィール情報を取得（存在しない場合はデフォルト値を使用）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    // プロフィールが存在しない場合はデフォルト値を使用
    const profileData = profile || {
      id: targetUserId,
      personal_color: null,
      frame_type: null,
      created_at: new Date().toISOString(),
    };

    // プロフィールエラーをログに記録（404は正常）
    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Profile fetch warning:', profileError);
    }

    // 統計情報を取得
    const [postsResult, followersResult, followingResult, isFollowingResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('is_public', true),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', targetUserId),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', targetUserId),
      supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .single()
    ]);

    return NextResponse.json({
      ...profileData,
      posts_count: postsResult.count || 0,
      followers_count: followersResult.count || 0,
      following_count: followingResult.count || 0,
      is_following: !!isFollowingResult.data,
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withAuth(getUserProfile);
