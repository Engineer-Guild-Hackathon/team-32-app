import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function getUserCloset(request: NextRequest, context: { params: Promise<{ userId: string }> }, userId: string) {
  try {
    const supabase = await createClient();

    const { userId: targetUserId } = await context.params;
    
    console.log('Fetching closet for user:', targetUserId);

    // ユーザーのクローゼットを取得
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    console.log('Items found:', items?.length || 0, 'items');
    if (items && items.length > 0) {
      console.log('First item:', items[0]);
    }

    if (error) {
      console.error('Error fetching user closet:', error);
      return NextResponse.json({ error: 'Failed to fetch closet' }, { status: 500 });
    }

    // クエリでカテゴリ別グルーピングを制御
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';

    // 既存のitemsをSNS用形式へ変換（通常の画像エンドポイントを使用）
    const closetItems = (items || []).map((item) => {
      console.log('Processing item:', item.id, 'image_path:', item.image_path);
      
      let imageUrl: string | null = null;
      if (item.image_path) {
        // SNS専用の画像エンドポイントを使用
        imageUrl = `/api/sns/images/${item.id}`;
        console.log('Generated SNS image URL:', imageUrl);
      } else {
        console.log('No image_path for item:', item.id);
      }

      const result = {
        id: item.id,
        name: `${item.category}アイテム`,
        category: item.category as string,
        image_url: imageUrl,
        created_at: item.created_at,
      };
      
      console.log('Final item result:', result);
      return result;
    });

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
