'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ClothingCategory } from '@/lib/types/clothing';
import { Heart, MessageCircle, Users, UserPlus, UserMinus, ArrowLeft, Shirt, Footprints, Watch } from 'lucide-react';
import { PiPantsLight } from 'react-icons/pi';
import { useUser } from '@/hooks/use-user';
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
  is_following?: boolean;
}

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  image_url?: string;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('tops');
  const categoryIcons: Record<ClothingCategory, React.ComponentType<{ className?: string }>> = {
    tops: Shirt,
    bottoms: PiPantsLight as unknown as React.ComponentType<{ className?: string }>,
    shoes: Footprints,
    accessories: Watch,
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
      fetchUserCloset();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/sns/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/sns/posts?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    }
  };

  const fetchUserCloset = async () => {
    try {
      const response = await fetch(`/api/sns/users/${userId}/closet`);
      if (response.ok) {
        const data = await response.json();
        setCloset(data);
      }
    } catch (error) {
      console.error('Failed to fetch user closet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/sns/users/${userId}/follow`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchUserProfile(); // プロフィールを再取得
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/sns/users/${userId}/follow`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchUserProfile(); // プロフィールを再取得
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/sns/posts/${postId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchUserPosts(); // 投稿を再取得
      }
    } catch (error) {
      console.error('Failed to like post:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <h1 className="text-lg font-bold text-foreground">ユーザープロフィール</h1>
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <h1 className="text-lg font-bold text-foreground">ユーザープロフィール</h1>
            <div></div>
          </div>
        </div>
        <div className="px-4 py-8 pb-20">
          <div className="text-center">
            <div className="mb-4">
              <div className="text-4xl mb-4">👤</div>
              <h2 className="text-lg font-bold mb-2">ユーザーが見つかりません</h2>
              <p className="text-sm text-muted-foreground">
                このユーザーは存在しないか、削除された可能性があります
              </p>
            </div>
            <Button className="mt-4" onClick={() => router.back()}>
              戻る
            </Button>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* スマートフォン用固定ヘッダー */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          <h1 className="text-lg font-bold text-foreground">ユーザープロフィール</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 px-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-4 py-4 pb-20 max-w-2xl mx-auto">

        {/* プロフィールヘッダー */}
        <Card className="mb-4 border-0 shadow-sm bg-white">
          <CardContent className="pt-4 px-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={`/api/avatar/${userId}`} />
                <AvatarFallback className="text-lg">
                  {profile.personal_color?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">ユーザー {userId.slice(0, 8)}</h2>
                  {currentUser && currentUser.id !== userId && (
                    <Button
                      variant={profile.is_following ? "outline" : "default"}
                      size="sm"
                      onClick={profile.is_following ? handleUnfollow : handleFollow}
                      className="h-7 px-3 text-xs"
                    >
                      {profile.is_following ? (
                        <>
                          <UserMinus className="w-3 h-3 mr-1" />
                          解除
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
                          フォロー
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {profile.personal_color ? (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {profile.personal_color}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      未設定
                    </Badge>
                  )}
                  {profile.frame_type && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {profile.frame_type}
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
            
            {/* 統計情報 */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold">{profile.posts_count}</div>
                <div className="text-xs text-muted-foreground">投稿</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{profile.followers_count}</div>
                <div className="text-xs text-muted-foreground">フォロワー</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{profile.following_count}</div>
                <div className="text-xs text-muted-foreground">フォロー中</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* タブ */}
        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-md p-1">
            <TabsTrigger value="posts" className="text-xs text-gray-600 rounded data-[state=active]:bg-white data-[state=active]:text-gray-900">投稿</TabsTrigger>
            <TabsTrigger value="closet" className="text-xs text-gray-600 rounded data-[state=active]:bg-white data-[state=active]:text-gray-900">クローゼット</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-3">
            {posts.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="text-center py-8 px-4">
                  <p className="text-muted-foreground text-sm">まだ投稿がありません</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <Card key={post.id} className="border-0 shadow-sm bg-white">
                    <CardContent className="pt-4 px-4 pb-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/api/avatar/${userId}`} />
                          <AvatarFallback className="text-xs">
                            {profile.personal_color?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{post.author_display_name || `ユーザー ${userId.slice(0, 8)}`}</p>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={`h-8 px-2 text-xs ${post.is_liked ? 'text-red-500' : 'text-gray-600'}`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
                          {post.likes_count}
                        </Button>
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

          <TabsContent value="closet" className="space-y-3">
            {closet.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-8 px-4">
                  <p className="text-muted-foreground text-sm">このユーザーはまだ服を登録していません</p>
                  <p className="text-xs text-muted-foreground mt-2">服を登録すると、ここに表示されます</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* カテゴリタブ */}
                <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ClothingCategory)}>
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-md p-1">
                    {(['tops','bottoms','shoes','accessories'] as ClothingCategory[]).map((cat) => {
                      const Icon = categoryIcons[cat];
                      return (
                        <TabsTrigger key={cat} value={cat} className="text-xs text-gray-600 rounded data-[state=active]:bg-white data-[state=active]:text-gray-900">
                          <Icon className="w-4 h-4" />
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {(['tops','bottoms','shoes','accessories'] as ClothingCategory[]).map((cat) => (
                    <TabsContent key={cat} value={cat} className="mt-3">
                      <div className="grid grid-cols-3 gap-2">
                        {closet.filter((i) => i.category === cat).map((item) => (
                          <Card key={item.id} className="overflow-hidden border-0 shadow-sm bg-white">
                            {item.image_url ? (
                              <div className="aspect-square bg-white">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="aspect-square bg-white flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                  <div className="text-xl mb-1">👕</div>
                                  <div className="text-xs">画像なし</div>
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                        {closet.filter((i) => i.category === cat).length === 0 && (
                          <div className="col-span-3">
                            <Card className="border-0 shadow-sm bg-white">
                              <CardContent className="text-center py-8 px-4">
                                <p className="text-muted-foreground text-sm">このカテゴリのアイテムはありません</p>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* モバイル用ボトムナビゲーション */}
      <MobileBottomNav />
    </div>
  );
}
