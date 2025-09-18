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
      (supabase as any)
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_public', true),
      (supabase as any)
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      (supabase as any)
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ]);

    // 自分の表示名（user_metadata.display_name）を付加
    let displayName: string | null = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === userId) {
        displayName = (user.user_metadata as any)?.display_name ?? null
      }
    } catch {}

    return NextResponse.json({
      ...profileData,
      posts_count: postsResult.count || 0,
      followers_count: followersResult.count || 0,
      following_count: followingResult.count || 0,
      display_name: displayName,
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(getProfile);

async function updateProfile(request: NextRequest, _context: any, userId: string) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const displayName = body.display_name as string | undefined;

    // display_name は profiles ではなく auth の user_metadata に保存
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: metaErr } = await supabase.auth.updateUser({
      data: { display_name: displayName ?? null },
    })

    if (metaErr) {
      console.error('Failed to update user metadata:', metaErr);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(updateProfile);
