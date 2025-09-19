"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClothingItems } from "@/hooks/use-clothing-items"
import { AddItemDialog } from "@/components/clothing/add-item-dialog"
import { CategoryTabs } from "@/components/clothing/category-tabs"
import type { ClothingCategory } from "@/lib/types/clothing"
import { BackgroundProvider, MobilePageBackground } from "@/components/mobile-background-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string;
  personal_color?: string;
  frame_type?: string;
  created_at: string;
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  image_url?: string;
  created_at: string;
}

export default function ClothingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = searchParams.get('userId')
  const isOtherUser = !!userId
  
  const { items, addItem, deleteItem } = useClothingItems()
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>("tops")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // 他のユーザーのデータ用の状態
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null)
  const [otherUserItems, setOtherUserItems] = useState<ClothingItem[]>([])
  const [isLoadingOtherUser, setIsLoadingOtherUser] = useState(false)

  // 他のユーザーのデータを取得
  useEffect(() => {
    if (isOtherUser && userId) {
      fetchOtherUserData()
    }
  }, [isOtherUser, userId])

  const fetchOtherUserData = async () => {
    if (!userId) return
    
    setIsLoadingOtherUser(true)
    try {
      // プロフィール情報を取得
      const profileResponse = await fetch(`/api/sns/users/${userId}`)
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setOtherUserProfile(profileData)
      }

      // クローゼットデータを取得
      const closetResponse = await fetch(`/api/sns/users/${userId}/closet`)
      if (closetResponse.ok) {
        const closetData = await closetResponse.json()
        setOtherUserItems(closetData)
      }
    } catch (error) {
      console.error('Failed to fetch other user data:', error)
    } finally {
      setIsLoadingOtherUser(false)
    }
  }

  // 表示するデータを決定（型を統一）
  const displayItems = isOtherUser 
    ? otherUserItems.map(item => ({
        ...item,
        image_path: item.image_url || '',
        user_id: userId || '',
        imageUrl: item.image_url,
        category: item.category as ClothingCategory
      }))
    : items
  const displayProfile = isOtherUser ? otherUserProfile : null

  return (
    <BackgroundProvider>
      <MobilePageBackground>
        <main className="min-h-screen">
          {/* スマートフォン用ヘッダー */}
          <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          {/* ハンバーガーメニューまたは戻るボタン */}
          {isOtherUser ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 px-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          )}

          {/* タイトル */}
          <h1 className="text-lg font-bold text-foreground">
            {isOtherUser ? 'ユーザーのクローゼット' : 'クローゼット'}
          </h1>

          {/* アイテム追加ボタン（自分のクローゼットの場合のみ） */}
          {!isOtherUser && (
            <AddItemDialog onItemAdded={addItem} defaultCategory={activeCategory}>
              <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">アイテム追加</span>
              </Button>
            </AddItemDialog>
          )}
          </div>
          </div>

          {/* メインコンテンツ */}
          <div className="px-4 py-4">
            {/* 他のユーザーのプロフィール情報 */}
            {isOtherUser && displayProfile && (
              <Card className="mb-4 border-0 shadow-sm bg-white">
                <CardContent className="pt-4 px-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={`/api/avatar/${userId}`} />
                      <AvatarFallback className="text-lg">
                        {displayProfile.personal_color?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <h2 className="text-lg font-bold">ユーザー {userId?.slice(0, 8)}</h2>
                      
                      <div className="flex flex-wrap gap-1">
                        {displayProfile.personal_color ? (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {displayProfile.personal_color}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            パーソナルカラー未設定
                          </Badge>
                        )}
                        {displayProfile.frame_type ? (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {displayProfile.frame_type}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            骨格タイプ未設定
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ローディング状態 */}
            {isOtherUser && isLoadingOtherUser ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">読み込み中...</p>
              </div>
            ) : (
              <CategoryTabs 
                items={displayItems}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                {...(isOtherUser ? {} : { onDeleteItem: deleteItem })}
              />
            )}
          </div>
        </main>
      </MobilePageBackground>
    </BackgroundProvider>
  )
}
