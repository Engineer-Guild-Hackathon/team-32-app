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

    // 既存のitemsテーブルの形式をSNS用の形式に変換
    const closetItems = (items || []).map(item => ({
      id: item.id,
      name: item.name || `${item.category}アイテム`,
      category: item.category,
      image_url: item.image_path ? 
        supabase.storage.from('users').getPublicUrl(item.image_path).data.publicUrl : 
        null,
      created_at: item.created_at
    }));

    return NextResponse.json(closetItems);
  } catch (error) {
    console.error('Error in getUserCloset:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withAuth(getUserCloset);
