"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Upload, Plus, Shirt, Package, Footprints, Watch, X, Edit, Trash2 } from "lucide-react"

type ClothingCategory = "tops" | "bottoms" | "shoes" | "accessories"

interface ClothingItem {
  id: string
  name: string
  category: ClothingCategory
  color: string
  brand?: string
  description?: string
  photo?: File
  tags: string[]
  createdAt: Date
}

const categoryConfig = {
  tops: {
    name: "トップス",
    icon: Shirt,
    placeholder: "シャツ、ブラウス、セーターなど",
  },
  bottoms: {
    name: "ボトムス",
    icon: Package,
    placeholder: "パンツ、スカート、ショーツなど",
  },
  shoes: {
    name: "シューズ",
    icon: Footprints,
    placeholder: "スニーカー、パンプス、ブーツなど",
  },
  accessories: {
    name: "小物",
    icon: Watch,
    placeholder: "バッグ、アクセサリー、帽子など",
  },
}

const colorOptions = [
  "ブラック",
  "ホワイト",
  "グレー",
  "ネイビー",
  "ブラウン",
  "ベージュ",
  "レッド",
  "ピンク",
  "オレンジ",
  "イエロー",
  "グリーン",
  "ブルー",
  "パープル",
]

export function ClothingManager() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>("tops")
  const [newItem, setNewItem] = useState<Partial<ClothingItem>>({
    name: "",
    category: "tops",
    color: "",
    brand: "",
    description: "",
    tags: [],
  })
  const [tagInput, setTagInput] = useState("")

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewItem((prev) => ({ ...prev, photo: file }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !newItem.tags?.includes(tagInput.trim())) {
      setNewItem((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewItem((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }))
  }

  const handleAddItem = () => {
    if (newItem.name && newItem.category && newItem.color) {
      const item: ClothingItem = {
        id: Date.now().toString(),
        name: newItem.name,
        category: newItem.category as ClothingCategory,
        color: newItem.color,
        brand: newItem.brand,
        description: newItem.description,
        photo: newItem.photo,
        tags: newItem.tags || [],
        createdAt: new Date(),
      }

      setItems((prev) => [...prev, item])
      setNewItem({
        name: "",
        category: "tops",
        color: "",
        brand: "",
        description: "",
        tags: [],
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
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground">
              <Upload className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {item.color}
            </Badge>
            {item.brand && (
              <Badge variant="outline" className="text-xs">
                {item.brand}
              </Badge>
            )}
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">服アイテム管理</h2>
          <p className="text-muted-foreground mt-2">あなたの服を登録して、着せ替えで使用できるようにしましょう</p>
        </div>

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
              <DialogDescription>服のアイテム情報を入力してください</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="item-name">アイテム名 *</Label>
                <Input
                  id="item-name"
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 白いシャツ"
                />
              </div>

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
                <Label htmlFor="color">色 *</Label>
                <Select
                  value={newItem.color}
                  onValueChange={(value) => setNewItem((prev) => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="色を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="brand">ブランド</Label>
                <Input
                  id="brand"
                  value={newItem.brand || ""}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, brand: e.target.value }))}
                  placeholder="例: UNIQLO"
                />
              </div>

              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={newItem.description || ""}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="アイテムの詳細説明"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="photo">写真</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="item-photo" />
                  <label htmlFor="item-photo" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm">{newItem.photo ? newItem.photo.name : "クリックして写真を選択"}</p>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">タグ</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="タグを入力"
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    追加
                  </Button>
                </div>
                {newItem.tags && newItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {newItem.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                キャンセル
              </Button>
              <Button onClick={handleAddItem} className="flex-1" disabled={!newItem.name || !newItem.color}>
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
                    <p className="text-sm">{config.placeholder}を追加してみましょう</p>
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
