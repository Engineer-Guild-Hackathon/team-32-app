'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Users, Settings, Edit } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';

interface UserProfile {
  id: string;
  personal_color?: string;
  frame_type?: string;
  created_at: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export default function ProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/sns/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch('/api/sns/posts?user_id=me');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <h1 className="text-lg font-bold text-foreground">マイプロフィール</h1>
            <div></div>
          </div>
        </div>
        <div className="px-4 py-8 pb-20">
          <div className="text-center">
            <p className="text-sm">ログインが必要です</p>
            <Button className="mt-4" onClick={() => router.push('/auth/login')}>
              ログイン
            </Button>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <h1 className="text-lg font-bold text-foreground">マイプロフィール</h1>
            <div></div>
          </div>
        </div>
        <div className="px-4 py-8 pb-20">
          <div className="text-center text-sm">読み込み中...</div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* スマートフォン用固定ヘッダー */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          <h1 className="text-lg font-bold text-foreground">マイプロフィール</h1>
          <Button variant="ghost" size="sm" className="h-8 px-3">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-4 py-4 pb-20 max-w-2xl mx-auto">

        {/* プロフィールヘッダー */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="pt-4 px-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={`/api/avatar/${user.id}`} />
                <AvatarFallback className="text-lg">
                  {profile?.personal_color?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <h2 className="text-lg font-bold">プロフィール情報</h2>
                
                <div className="flex flex-wrap gap-1">
                  {profile?.personal_color && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {profile.personal_color}
                    </Badge>
                  )}
                  {profile?.frame_type && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {profile.frame_type}
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {profile ? formatDate(profile.created_at) : '不明'}
                </p>
              </div>
            </div>
            
            {/* 統計情報 */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold">{profile?.posts_count || 0}</div>
                <div className="text-xs text-muted-foreground">投稿</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{profile?.followers_count || 0}</div>
                <div className="text-xs text-muted-foreground">フォロワー</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{profile?.following_count || 0}</div>
                <div className="text-xs text-muted-foreground">フォロー中</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* タブ */}
        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts" className="text-xs">投稿</TabsTrigger>
            <TabsTrigger value="likes" className="text-xs">いいね</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-3">
            {posts.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-8 px-4">
                  <p className="text-muted-foreground text-sm mb-4">まだ投稿がありません</p>
                  <Link href="/sns/create">
                    <Button size="lg" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      最初の投稿を作成
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <Card key={post.id} className="border-0 shadow-sm">
                    <CardContent className="pt-4 px-4 pb-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/api/avatar/${user.id}`} />
                          <AvatarFallback className="text-xs">
                            {profile?.personal_color?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">あなた</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(post.created_at)}
                          </p>
                        </div>
                      </div>
                      
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
                      
                      <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">{post.likes_count}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">{post.comments_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes">
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-8 px-4">
                <p className="text-muted-foreground text-sm">いいねした投稿はありません</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* モバイル用ボトムナビゲーション */}
      <MobileBottomNav />
    </div>
  );
}
