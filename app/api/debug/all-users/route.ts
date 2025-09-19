import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function getAllUsers(request: NextRequest, userId: string) {
  try {
    const supabase = await createClient();
    
    // すべてのプロフィールを取得
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // すべてのアイテムを取得
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    // ユーザーごとのアイテム数を集計
    const userItemCounts = (items || []).reduce((acc, item) => {
      acc[item.user_id] = (acc[item.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      profiles: profiles || [],
      profilesCount: profiles?.length || 0,
      items: items || [],
      itemsCount: items?.length || 0,
      userItemCounts,
      profilesError,
      itemsError
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withAuth(getAllUsers);
