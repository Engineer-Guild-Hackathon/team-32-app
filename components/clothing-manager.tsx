"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Plus, Shirt, Package, Footprints, Watch, Trash2 } from "lucide-react"

type ClothingCategory = "tops" | "bottoms" | "shoes" | "accessories"

interface ClothingItem {
  id: string
  category: ClothingCategory
  image_path: string
  created_at: string
  user_id: string
  imageUrl?: string
}

const categoryConfig = {
  tops: {
    name: "トップス",
    icon: Shirt,
  },
  bottoms: {
    name: "ボトムス",
    icon: Package,
  },
  shoes: {
    name: "シューズ",
    icon: Footprints,
  },
  accessories: {
    name: "小物",
    icon: Watch,
  },
}

export function ClothingManager() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>("tops")
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>("tops")
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedPhoto(file)
    }
  }

  const handleAddItem = async () => {
    if (!selectedCategory || !selectedPhoto) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedPhoto)
      formData.append('category', selectedCategory)

      const response = await fetch('/api/items', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setItems((prev) => [data.item, ...prev])
        setSelectedPhoto(null)
        setIsAddDialogOpen(false)
      } else {
        const error = await response.json()
        alert(`アイテムの追加に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to add item:', error)
      alert('アイテムの追加に失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      } else {
        const error = await response.json()
        alert(`アイテムの削除に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      alert('アイテムの削除に失敗しました')
    }
  }


  const getItemsByCategory = (category: ClothingCategory) => {
    return items.filter((item) => item.category === category)
  }

  const ItemCard = ({ item }: { item: ClothingItem }) => (
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
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              アイテム追加
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>新しいアイテムを追加</DialogTitle>
              <DialogDescription>カテゴリーを選択して画像をアップロードしてください</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="category">カテゴリー *</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as ClothingCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="photo">写真 *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="item-photo" />
                  <label htmlFor="item-photo" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm">{selectedPhoto ? selectedPhoto.name : "クリックして写真を選択"}</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                キャンセル
              </Button>
              <Button onClick={handleAddItem} className="flex-1" disabled={!selectedCategory || !selectedPhoto || isUploading}>
                {isUploading ? "アップロード中..." : "追加"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as ClothingCategory)}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon
            const itemCount = getItemsByCategory(key as ClothingCategory).length
            return (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="w-4 h-4" />
                {config.name}
                {itemCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {itemCount}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.entries(categoryConfig).map(([key, config]) => (
          <TabsContent key={key} value={key}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {getItemsByCategory(key as ClothingCategory).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}

              {getItemsByCategory(key as ClothingCategory).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground">
                    <config.icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">まだ{config.name}がありません</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
