import { createServiceClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import { v4 as uuidv4 } from 'uuid';

type Plan = Database['public']['Enums']['plan'];

// プラン別の制限値
const PLAN_LIMITS: Record<Plan, { daily: number }> = {
  free: {
    daily: 20,
  },
  pro: {
    daily: 1000,
  },
};

export class ApiUsageLimiter {
  private supabase;

  constructor() {
    this.supabase = createServiceClient();
  }

  /**
   * ユーザーのプランを取得
   */
  private async getUserPlan(userId: string): Promise<Plan> {
    const { data, error } = await this.supabase
      .from('user_plans')
      .select('plan')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user plan:', error);
      throw new Error(`User plan not found for user ${userId}`);
    }

    return data.plan;
  }

  /**
   * API利用を予約する
   */
  async reserveUsage(userId: string): Promise<{ success: boolean; requestId?: string; error?: string; plan?: string }> {
    const requestId = uuidv4();
    const today = new Date().toISOString().split('T')[0];

    try {
      // ユーザーのプランを取得
      const plan = await this.getUserPlan(userId);
      const limits = PLAN_LIMITS[plan];

      const { data, error } = await this.supabase.rpc('reserve_usage', {
        p_user_id: userId,
        p_ymd: today,
        p_request_id: requestId,
        p_limit: limits.daily,
      });

      if (error) {
        console.error('Error reserving usage:', error);
        return { success: false, error: 'Failed to reserve API usage' };
      }

      if (!data) {
        // 利用制限に達した
        return { 
          success: false, 
          error: `Daily API limit reached (${limits.daily} requests per day for ${plan} plan). Please try again tomorrow.`,
          plan 
        };
      }

      return { success: true, requestId, plan };
    } catch (error) {
      console.error('Unexpected error in reserveUsage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  }

  /**
   * API処理成功時に呼び出す
   */
  async finalizeSuccess(userId: string, requestId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const { error } = await this.supabase.rpc('finalize_usage_success', {
        p_user_id: userId,
        p_ymd: today,
        p_request_id: requestId,
      });

      if (error) {
        console.error('Error finalizing success:', error);
      }
    } catch (error) {
      console.error('Unexpected error in finalizeSuccess:', error);
    }
  }

  /**
   * API処理失敗時に呼び出す
   */
  async finalizeFailure(userId: string, requestId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const { error } = await this.supabase.rpc('finalize_usage_failure', {
        p_user_id: userId,
        p_ymd: today,
        p_request_id: requestId,
      });

      if (error) {
        console.error('Error finalizing failure:', error);
      }
    } catch (error) {
      console.error('Unexpected error in finalizeFailure:', error);
    }
  }

  /**
   * 現在の利用状況を取得
   */
  async getUsageStatus(userId: string): Promise<{
    used: number;
    inflight: number;
    remaining: number;
    canReserve: boolean;
    limit: number;
    plan: Plan;
  }> {
    try {
      // ユーザーのプランを取得
      const plan = await this.getUserPlan(userId);
      const limits = PLAN_LIMITS[plan];

      const { data, error } = await this.supabase.rpc('get_usage_status', {
        p_user_id: userId,
        p_limit: limits.daily,
      });

      if (error) {
        console.error('Error getting usage status:', error);
        throw new Error(`Failed to get usage status: ${error.message}`);
      }

      const status = data?.[0] || {
        used: 0,
        inflight: 0,
        remaining: limits.daily,
        can_reserve: true,
      };

      return {
        used: status.used,
        inflight: status.inflight,
        remaining: status.remaining,
        canReserve: status.can_reserve,
        limit: limits.daily,
        plan,
      };
    } catch (error) {
      console.error('Unexpected error in getUsageStatus:', error);
      throw error instanceof Error ? error : new Error('Failed to get usage status');
    }
  }
}

// シングルトンインスタンスをエクスポート
export const apiUsageLimiter = new ApiUsageLimiter();