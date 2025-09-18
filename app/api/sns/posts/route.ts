import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function getPosts(request: NextRequest, context: any, userId: string) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('posts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (targetUserId === 'me') {
      query = query.eq('user_id', userId);
    } else if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    console.log('Fetched posts count:', posts?.length || 0);

    // いいね状態を取得
    if (posts && posts.length > 0) {
      const postIds = posts.map(post => post.id);
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

      // 投稿者ごとの display_name を auth.user_metadata から取得（サービスキー利用）
      const authorIds = Array.from(new Set(posts.map(p => p.user_id)));
      const authorDisplayNameMap: Record<string, string | null> = {};
      try {
        const service = createServiceClient();
        for (const id of authorIds) {
          try {
            const { data: userRes } = await (service as any).auth.admin.getUserById(id);
            const u = (userRes as any)?.user;
            if (u) {
              authorDisplayNameMap[id] = u.user_metadata?.display_name ?? null;
            }
          } catch {}
        }
      } catch {}

      // いいね状態と表示名を追加
      const postsWithLikes = posts.map(post => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
        author_display_name: authorDisplayNameMap[post.user_id] ?? null,
      }));

      return NextResponse.json(postsWithLikes);
    }

    return NextResponse.json(posts || []);
  } catch (error) {
    console.error('Error in getPosts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createPost(request: NextRequest, context: any, userId: string) {
  try {
    const supabase = await createClient();

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const isPublic = formData.get('is_public') === 'true';
    const imageFile = formData.get('image') as File | null;

    if (!content?.trim() && !imageFile) {
      return NextResponse.json({ error: 'Content or image is required' }, { status: 400 });
    }

    let imageUrl = null;

    // 画像アップロード処理
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `sns-posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    // 投稿を作成
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content?.trim() || '',
        image_url: imageUrl,
        is_public: isPublic,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating post:', insertError);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    console.log('Post created successfully:', post);
    return NextResponse.json({ ...post, is_liked: false });
  } catch (error) {
    console.error('Error in createPost:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(getPosts);
export const POST = withAuth(createPost);
