"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Upload, Plus, Shirt, Package, Footprints, Watch, Edit, Trash2 } from "lucide-react"

type ClothingCategory = "tops" | "bottoms" | "shoes" | "accessories"

interface ClothingItem {
  id: string
  category: ClothingCategory
  photo?: File
  createdAt: Date
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
  const [newItem, setNewItem] = useState<Partial<ClothingItem>>({
    category: "tops",
  })

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewItem((prev) => ({ ...prev, photo: file }))
    }
  }

  const handleAddItem = () => {
    if (newItem.category && newItem.photo) {
      const item: ClothingItem = {
        id: Date.now().toString(),
        category: newItem.category as ClothingCategory,
        photo: newItem.photo,
        createdAt: new Date(),
      }

      setItems((prev) => [...prev, item])
      setNewItem({
        category: "tops",
      })
      setIsAddDialogOpen(false)
    }
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const getItemsByCategory = (category: ClothingCategory) => {
    return items.filter((item) => item.category === category)
  }

  const ItemCard = ({ item }: { item: ClothingItem }) => (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {item.photo ? (
            <img
              src={URL.createObjectURL(item.photo) || "/placeholder.svg"}
              alt="Clothing item"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground">
              <Upload className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Edit className="w-3 h-3" />
              </Button>
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
                  value={newItem.category}
                  onValueChange={(value) => setNewItem((prev) => ({ ...prev, category: value as ClothingCategory }))}
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
                    <p className="text-sm">{newItem.photo ? newItem.photo.name : "クリックして写真を選択"}</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                キャンセル
              </Button>
              <Button onClick={handleAddItem} className="flex-1" disabled={!newItem.category || !newItem.photo}>
                追加
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
