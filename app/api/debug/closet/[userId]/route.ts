import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function debugUserCloset(request: NextRequest, context: { params: Promise<{ userId: string }> }, userId: string) {
  try {
    const supabase = await createClient();
    const { userId: targetUserId } = await context.params;
    
    console.log('=== DEBUG: Fetching closet for user ===');
    console.log('Target user ID:', targetUserId);
    console.log('Current user ID:', userId);

    // ユーザーのクローゼットを取得
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    console.log('Items query result:');
    console.log('- Error:', error);
    console.log('- Items count:', items?.length || 0);
    console.log('- Items:', items);

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch closet',
        details: error,
        targetUserId,
        currentUserId: userId
      }, { status: 500 });
    }

    // 画像URLのテスト
    const itemsWithImageInfo = (items || []).map((item) => {
      const imageUrl = item.image_path ? `/api/sns/items/${item.id}/image` : null;
      return {
        id: item.id,
        category: item.category,
        image_path: item.image_path,
        image_url: imageUrl,
        created_at: item.created_at,
      };
    });

    return NextResponse.json({
      targetUserId,
      currentUserId: userId,
      itemsCount: items?.length || 0,
      items: itemsWithImageInfo,
      rawItems: items
    });
  } catch (error) {
    console.error('Error in debugUserCloset:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withAuth(debugUserCloset);
