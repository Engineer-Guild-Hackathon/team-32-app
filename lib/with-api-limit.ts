import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUsageLimiter } from './api-usage-limiter';

/**
 * API利用制限を適用するミドルウェア
 * 
 * @param handler - 実際のAPIハンドラー関数
 * @returns ラップされたAPIハンドラー
 */
export function withApiLimit(
  handler: (req: NextRequest, userId: string, requestId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // 認証チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // API利用を予約
    const reservation = await apiUsageLimiter.reserveUsage(user.id);

    if (!reservation.success) {
      // 利用状況を取得して詳細情報を返す
      const status = await apiUsageLimiter.getUsageStatus(user.id);
      
      return NextResponse.json(
        {
          error: reservation.error,
          usage: {
            used: status.used,
            inflight: status.inflight,
            remaining: status.remaining,
            limit: status.limit,
            plan: status.plan,
            resetAt: new Date().setHours(24, 0, 0, 0), // 次の日の0時
          },
        },
        { status: 429 } // Too Many Requests
      );
    }

    const requestId = reservation.requestId!;

    try {
      // 実際のAPIハンドラーを実行
      const response = await handler(req, user.id, requestId);
      
      // 成功した場合
      if (response.status >= 200 && response.status < 300) {
        await apiUsageLimiter.finalizeSuccess(user.id, requestId);
      } else {
        // APIハンドラーがエラーを返した場合
        await apiUsageLimiter.finalizeFailure(user.id, requestId);
      }

      return response;
    } catch (error) {
      // 予期しないエラーが発生した場合
      await apiUsageLimiter.finalizeFailure(user.id, requestId);
      
      console.error('Error in API handler:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * 現在の利用状況を取得するためのユーティリティ関数
 */
export async function getUserApiUsage(userId: string) {
  return await apiUsageLimiter.getUsageStatus(userId);
}