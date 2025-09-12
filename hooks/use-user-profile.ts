'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  personalColor: string | null;
  frameType: string | null;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * ユーザープロフィール情報を取得するカスタムフック
 */
export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // キャッシュを無効化して最新データを取得
      const response = await fetch('/api/profile', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error('プロフィールの取得に失敗しました');
      }

      const data = await response.json();
      setProfile({
        personalColor: data.personal_color,
        frameType: data.frame_type
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('プロフィール取得エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile
  };
}

/**
 * パーソナルカラーのみを取得するカスタムフック
 */
export function usePersonalColor(): {
  personalColor: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { profile, isLoading, error, refetch } = useUserProfile();

  return {
    personalColor: profile?.personalColor || null,
    isLoading,
    error,
    refetch
  };
}
