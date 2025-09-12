'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UsageStatus {
  used: number;
  inflight: number;
  remaining: number;
  limit: number;
  plan: string;
  canReserve: boolean;
  resetAt: number;
}

interface UsageConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function UsageConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title = '機能を使用しますか？',
  description = 'この機能を使用すると、1回分の利用回数を消費します。',
}: UsageConfirmationDialogProps) {
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsageStatus();
    }
  }, [isOpen]);

  const fetchUsageStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch usage status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const formatResetTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">利用状況を確認中...</p>
            </div>
          ) : usage ? (
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">今日の利用状況</span>
                  <span className="text-xs text-gray-500">{usage.plan}プラン</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">
                    残り {usage.remaining} 回
                  </span>
                  <span className="text-sm text-gray-600">
                    {usage.used + usage.inflight}/{usage.limit}
                  </span>
                </div>
                {usage.inflight > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    処理中: {usage.inflight}回
                  </p>
                )}
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                利用回数は {formatResetTime(usage.resetAt)} にリセットされます
              </p>

              {!usage.canReserve && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-700">
                    今日の利用上限に達しています。明日まで待つか、プランのアップグレードをご検討ください。
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">利用状況を取得できませんでした</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !usage?.canReserve}
          >
            実行する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}