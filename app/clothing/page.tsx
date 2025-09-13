"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClothingItems } from "@/hooks/use-clothing-items"
import { AddItemDialog } from "@/components/clothing/add-item-dialog"
import { CategoryTabs } from "@/components/clothing/category-tabs"
import type { ClothingCategory } from "@/lib/types/clothing"
import { BackgroundProvider, MobilePageBackground } from "@/components/mobile-background-provider"
import { AppSidebar } from "@/components/app-sidebar"

export default function ClothingPage() {
  const { items, addItem, deleteItem } = useClothingItems()
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>("tops")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <BackgroundProvider>
      <MobilePageBackground>
        <main className="min-h-screen">
          {/* スマートフォン用ヘッダー */}
          <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          {/* ハンバーガーメニュー */}
          <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

          {/* タイトル */}
          <h1 className="text-lg font-bold text-foreground">クローゼット</h1>

          {/* アイテム追加ボタン */}
          <AddItemDialog onItemAdded={addItem}>
            <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">アイテム追加</span>
            </Button>
          </AddItemDialog>
          </div>
          </div>

          {/* メインコンテンツ */}
          <div className="px-4 py-4">
            <CategoryTabs 
              items={items}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onDeleteItem={deleteItem}
            />
          </div>
        </main>
      </MobilePageBackground>
    </BackgroundProvider>
  )
}
