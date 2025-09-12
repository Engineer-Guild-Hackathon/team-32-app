import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface PlanCheckResult {
  user: any;
  userPlan: { plan: 'free' | 'pro' };
  error?: never;
}

export interface PlanCheckError {
  user?: never;
  userPlan?: never;
  error: NextResponse;
}

export async function checkUserPlan(): Promise<PlanCheckResult | PlanCheckError> {
  const supabase = await createClient();

  // ユーザー認証の確認
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    };
  }

  // ユーザーのプランを確認
  const { data: userPlan, error: planError } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', user.id)
    .single();

  if (planError || !userPlan) {
    console.error('Plan error:', planError);
    return {
      error: NextResponse.json({
        error: 'User plan not found',
        debug: { planError: planError?.message }
      }, { status: 403 })
    };
  }

  return { user, userPlan };
}

export function checkProPlan(userPlan: { plan: 'free' | 'pro' }): NextResponse | null {
  if (userPlan.plan === 'free') {
    return NextResponse.json({
      error: 'This feature is only available for Pro users. Please upgrade your plan.'
    }, { status: 403 });
  }
  return null;
}