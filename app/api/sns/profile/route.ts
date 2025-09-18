import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function getProfile(request: NextRequest, context: any, userId: string) {
  try {
    const supabase = await createClient();

    // ユーザープロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // プロフィールが存在しない場合はデフォルト値を使用
    const profileData = profile || {
      id: userId,
      personal_color: null,
      frame_type: null,
      created_at: new Date().toISOString(),
    };

    // プロフィールエラーをログに記録（404は正常）
    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Profile fetch warning:', profileError);
    }

    // 統計情報を取得
    const [postsResult, followersResult, followingResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_public', true),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ]);

    return NextResponse.json({
      ...profileData,
      posts_count: postsResult.count || 0,
      followers_count: followersResult.count || 0,
      following_count: followingResult.count || 0,
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(getProfile);
