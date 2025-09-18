import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 認証のみを行うミドルウェア（API利用制限なし）
 * 
 * @param handler - 実際のAPIハンドラー関数
 * @returns ラップされたAPIハンドラー
 */
export function withAuth(
  handler: (req: NextRequest, context: any, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    // 認証チェックのみ
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      // 実際のAPIハンドラーを実行
      const response = await handler(req, context, user.id);
      return response;
    } catch (error) {
      console.error('Error in API handler:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
