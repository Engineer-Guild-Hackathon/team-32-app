import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function getUserCloset(request: NextRequest, context: { params: Promise<{ userId: string }> }, userId: string) {
  try {
    const supabase = await createClient();

    const { userId: targetUserId } = await context.params;

    // ユーザーのクローゼットを取得
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user closet:', error);
      return NextResponse.json({ error: 'Failed to fetch closet' }, { status: 500 });
    }

    // クエリでカテゴリ別グルーピングを制御
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';

    // 既存のitemsをSNS用形式へ変換（ストレージは署名付きURLを発行）
    const closetItems = await Promise.all((items || []).map(async (item) => {
      let imageUrl: string | null = null;
      if (item.image_path) {
        const { data: signed, error: signedErr } = await supabase
          .storage
          .from('users')
          .createSignedUrl(item.image_path, 60 * 60); // 有効期限: 1時間

        if (!signedErr && signed?.signedUrl) {
          imageUrl = signed.signedUrl;
        } else {
          console.warn('Failed to create signed URL for', item.image_path, signedErr);
        }
      }

      return {
        id: item.id,
        name: `${item.category}アイテム`,
        category: item.category as string,
        image_url: imageUrl,
        created_at: item.created_at,
      };
    }));

    if (!grouped) {
      return NextResponse.json(closetItems);
    }

    // 種類（カテゴリ）ごとに配列でグルーピング
    type ClosetItem = typeof closetItems[number];
    const groupedByCategory = closetItems.reduce<Record<string, ClosetItem[]>>((acc, item) => {
      const key = item.category || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return NextResponse.json(groupedByCategory);
  } catch (error) {
    console.error('Error in getUserCloset:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withAuth(getUserCloset);
