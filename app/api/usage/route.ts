import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiUsageLimiter } from '@/lib/api-usage-limiter';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const status = await apiUsageLimiter.getUsageStatus(user.id);

    return NextResponse.json({
      usage: {
        used: status.used,
        inflight: status.inflight,
        remaining: status.remaining,
        limit: status.limit,
        plan: status.plan,
        canReserve: status.canReserve,
        resetAt: new Date().setHours(24, 0, 0, 0), // 次の日の0時
      },
    });
  } catch (error) {
    console.error('Error fetching usage status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}