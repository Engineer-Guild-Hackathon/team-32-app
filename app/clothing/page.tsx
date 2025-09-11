"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClothingItems } from "@/hooks/use-clothing-items"
import { AddItemDialog } from "@/components/clothing/add-item-dialog"
import { CategoryTabs } from "@/components/clothing/category-tabs"
import type { ClothingCategory } from "@/lib/types/clothing"

export default function ClothingPage() {
  const { items, addItem, deleteItem } = useClothingItems()
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>("tops")
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              プロフィール設定に戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">服アイテム管理</h1>
            <p className="text-muted-foreground">お気に入りの服を登録して、コーディネートの幅を広げましょう</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <AddItemDialog onItemAdded={addItem} />
          </div>

          <CategoryTabs 
            items={items}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onDeleteItem={deleteItem}
          />
        </div>

        <div className="max-w-6xl mx-auto mt-8">
          <Link href="/styling">
            <Button className="w-full">
              着せ替え・スタイル分析に進む
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
