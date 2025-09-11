"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
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
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          <img
            src={`/api/items/${item.id}/image`}
            alt="Clothing item"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}