'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { AppSidebar } from '@/components/app-sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  is_liked?: boolean;
}

export default function SNSHomePage() {
  const { user } = useUser();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  // ページがフォーカスされた時に投稿を再取得
  useEffect(() => {
    const handleFocus = () => {
      fetchPosts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/sns/posts');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched posts:', data);
        setPosts(data);
      } else {
        console.error('Failed to fetch posts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/sns/posts/${postId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchPosts(); // 投稿を再取得
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'たった今';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    if (diffInHours < 48) return '昨日';
    return date.toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* スマートフォン用固定ヘッダー */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* ハンバーガーメニュー */}
          <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          
          {/* タイトル */}
          <h1 className="text-lg font-bold text-foreground">タイムライン</h1>
          
          {/* 投稿ボタン */}
          <Link href="/sns/create">
            <Button size="sm" className="h-8 px-3">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-4 py-4 pb-20 max-w-2xl mx-auto">

        {/* 投稿一覧 */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="mx-0 bg-white">
              <CardContent className="text-center py-12 px-6">
                <p className="text-muted-foreground text-sm mb-4">まだ投稿がありません</p>
                <Link href="/sns/create">
                  <Button size="lg" className="w-full">
                    最初の投稿を作成
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden border-0 shadow-sm bg-white">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-sm">
                          U
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">ユーザー {post.user_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                    </div>
                    <Link href={`/sns/user/${post.user_id}`}>
                      <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-7">
                        クローゼット
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 px-4 pb-4">
                  <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                  
                  {post.image_url && (
                    <div className="mb-3">
                      <img
                        src={post.image_url}
                        alt="投稿画像"
                        className="w-full h-auto rounded-lg object-cover max-h-80"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={`h-8 px-2 text-xs ${post.is_liked ? 'text-red-500' : 'text-gray-600'}`}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
                        {post.likes_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-gray-600">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {post.comments_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-gray-600">
                        <Share className="w-4 h-4 mr-1" />
                        共有
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* モバイル用ボトムナビゲーション */}
      <MobileBottomNav />
    </div>
  );
}
