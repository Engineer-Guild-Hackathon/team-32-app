"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Search } from "lucide-react"
import type { ClothingItem } from "@/lib/types/clothing"

interface ItemCardProps {
  item: ClothingItem
  onDelete: (id: string) => Promise<void>
}

export function ItemCard({ item, onDelete }: ItemCardProps) {
  const handleDelete = async () => {
    try {
      await onDelete(item.id)
    } catch (error) {
      alert(`アイテムの削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <Card className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
      <CardContent className="p-0">
        <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
          <img
            src={`/api/items/${item.id}/image`}
            alt="Clothing item"
            className="w-full h-full object-cover"
          />
          
          {/* 右下のアイコン */}
          <div className="absolute bottom-1 right-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 bg-white/80 hover:bg-white text-gray-600 hover:text-red-600 rounded-full shadow-sm"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}