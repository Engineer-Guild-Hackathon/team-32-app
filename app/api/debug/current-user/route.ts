import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';

async function getCurrentUser(request: NextRequest, userId: string) {
  try {
    const supabase = await createClient();
    
    // 現在のユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Failed to get current user',
        details: userError
      }, { status: 500 });
    }

    // 現在のユーザーのアイテムを取得
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      itemsCount: items?.length || 0,
      items: items || [],
      itemsError: itemsError
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withAuth(getCurrentUser);
