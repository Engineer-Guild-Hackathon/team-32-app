'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { AppSidebar } from '@/components/app-sidebar';

export default function CreatePostPage() {
  const { user } = useUser();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) {
      alert('投稿内容または画像を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('is_public', isPublic.toString());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch('/api/sns/posts', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // 投稿成功後、タイムラインページに遷移
        alert('投稿が作成されました！');
        router.push('/sns');
      } else {
        const error = await response.json();
        alert(`投稿に失敗しました: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>ログインが必要です</p>
          <Button className="mt-4" onClick={() => router.push('/auth/login')}>
            ログイン
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-xl sm:max-w-2xl bg-white min-h-screen">
      {/* ヘッダー（モバイル最適化） */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="ml-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <h1 className="text-lg font-bold">新しい投稿</h1>
          <div className="w-6" />
        </div>
      </div>

      <Card className="shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">投稿を作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* テキスト入力 */}
            <div className="space-y-2">
              <Label htmlFor="content">投稿内容</Label>
              <Textarea
                id="content"
                placeholder="今日のコーディネートをシェアしましょう..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] text-base sm:text-sm"
              />
            </div>

            {/* 画像アップロード */}
            <div className="space-y-2">
              <Label htmlFor="image">画像</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center bg-white">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="image" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="プレビュー"
                        className="w-full h-40 sm:h-48 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        画像を削除
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        クリックして画像をアップロード
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, GIF 形式に対応
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* 公開設定 */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="is_public">公開投稿</Label>
                <p className="text-sm text-muted-foreground">
                  他のユーザーに投稿を表示します
                </p>
              </div>
              <Switch
                id="is_public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '投稿中...' : '投稿する'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
