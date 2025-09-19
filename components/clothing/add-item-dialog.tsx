"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Plus, Sparkles, Search } from "lucide-react"
import { generateClothingItemImage } from "@/lib/gemini"
import type { ClothingCategory, ClothingItem } from "@/lib/types/clothing"
import { categoryConfig } from "@/lib/types/clothing"
import { UsageConfirmationDialog } from "@/components/usage-confirmation-dialog"

interface AddItemDialogProps {
  onItemAdded: (item: ClothingItem) => void
  defaultCategory?: ClothingCategory
  children?: React.ReactNode
}

export function AddItemDialog({ onItemAdded, defaultCategory = "tops", children }: AddItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>(defaultCategory)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [generatedImageFile, setGeneratedImageFile] = useState<File | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedPhoto(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveItem = async (file: File, category: ClothingCategory) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const response = await fetch('/api/items', {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      const data = await response.json()
      return data.item
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save item')
    }
  }

  const handleAddItem = async () => {
    if (!selectedCategory || !selectedPhoto) return

    setIsUploading(true)
    try {
      const item = await saveItem(selectedPhoto, selectedCategory)
      onItemAdded(item)
      setSelectedPhoto(null)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to add item:', error)
      alert(`アイテムの追加に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerateClick = () => {
    if (!aiPrompt) return;
    setShowConfirmDialog(true);
  }

  const handleGenerateImage = async () => {
    setIsGenerating(true)
    try {
      const result = await generateClothingItemImage(aiPrompt)
      
      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl)
        
        const response = await fetch(result.imageUrl)
        const blob = await response.blob()
        const file = new File([blob], 'generated-image.png', { type: 'image/png' })
        setGeneratedImageFile(file)
      } else {
        alert(`画像の生成に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
      alert('画像の生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveGeneratedItem = async () => {
    if (!selectedCategory || !generatedImageFile) return

    setIsUploading(true)
    try {
      const item = await saveItem(generatedImageFile, selectedCategory)
      onItemAdded(item)
      setAiPrompt("")
      setGeneratedImageUrl(null)
      setGeneratedImageFile(null)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to save generated item:', error)
      alert(`アイテムの保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      const response = await fetch('/api/items/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          category: selectedCategory
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.items || [])
      } else {
        console.error('Search failed')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchItem = async (searchItem: any) => {
    // Download the image from ec_item_images and save it as a new item
    try {
      setIsUploading(true)

      // Fetch the image
      const response = await fetch(searchItem.image_url)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }

      const blob = await response.blob()
      const file = new File([blob], `search-${searchItem.id}.jpg`, { type: 'image/jpeg' })

      // Save as new item with selected category
      const item = await saveItem(file, selectedCategory)
      onItemAdded(item)
      handleClose()
    } catch (error) {
      console.error('Failed to add search item:', error)
      alert('アイテムの追加に失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedPhoto(null)
    setSelectedPhotoPreview(null)
    setAiPrompt("")
    setGeneratedImageUrl(null)
    setGeneratedImageFile(null)
    setSelectedCategory(defaultCategory)
    setSearchQuery("")
    setSearchResults([])
    setHasSearched(false)
  }

  const handleOpen = (open: boolean) => {
    if (open) {
      setSelectedCategory(defaultCategory)
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            アイテム追加
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しいアイテムを追加</DialogTitle>
          <DialogDescription>カテゴリーを選択して画像を追加してください</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              写真を登録
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              探す
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI生成
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label htmlFor="category-upload">カテゴリー *</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value as ClothingCategory)
                  setHasSearched(false)
                }}
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
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" id="item-photo" />
                <label htmlFor="item-photo" className="cursor-pointer">
                  {selectedPhotoPreview ? (
                    <div className="space-y-2">
                      <img src={selectedPhotoPreview} alt="Preview" className="w-full h-48 object-contain rounded" />
                    </div>
                  ) : (
                    <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm">クリックして写真を選択</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                キャンセル
              </Button>
              <Button onClick={handleAddItem} className="flex-1" disabled={!selectedCategory || !selectedPhoto || isUploading}>
                {isUploading ? "アップロード中..." : "追加"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div>
              <Label htmlFor="category-generate">カテゴリー *</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value as ClothingCategory)
                  setHasSearched(false)
                }}
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
              <Label htmlFor="ai-prompt">アイテムの説明 *</Label>
              <Textarea
                id="ai-prompt"
                placeholder="例: 白いTシャツ、黒いデニムパンツ、赤いスニーカーなど"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {generatedImageUrl && (
              <div className="border rounded-lg p-2">
                <img src={generatedImageUrl} alt="Generated item" className="w-full h-auto rounded" />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                キャンセル
              </Button>
              {!generatedImageUrl ? (
                <Button onClick={handleGenerateClick} className="flex-1" disabled={!aiPrompt || isGenerating}>
                  {isGenerating ? "生成中..." : "画像を生成"}
                </Button>
              ) : (
                <Button onClick={handleSaveGeneratedItem} className="flex-1" disabled={!selectedCategory || isUploading}>
                  {isUploading ? "保存中..." : "保存"}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div>
              <Label htmlFor="category-search">カテゴリー *</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value as ClothingCategory)
                  setHasSearched(false)
                }}
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
              <Label htmlFor="search-query">検索キーワード（英語を推奨）</Label>
              <div className="flex gap-2">
                <Input
                  id="search-query"
                  placeholder="例: white t-shirt, black jeans"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setHasSearched(false)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={!searchQuery || isSearching}>
                  {isSearching ? "検索中..." : "検索"}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div>
                <Label>検索結果 ({searchResults.length}件)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-2 cursor-pointer hover:border-primary transition-colors relative"
                      onClick={() => handleSelectSearchItem(item)}
                    >
                      <img
                        src={item.image_url}
                        alt="Search result"
                        className="w-full h-24 object-cover rounded"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded">
                          <span className="text-xs">追加中...</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && !isSearching && (
              <p className="text-sm text-muted-foreground text-center py-4">
                検索結果が見つかりませんでした
              </p>
            )}
          </TabsContent>
        </Tabs>
        
        <UsageConfirmationDialog
          isOpen={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleGenerateImage}
          title="アイテム画像を生成しますか？"
          description="この機能を使用すると、1回分の利用回数を消費します。"
        />
      </DialogContent>
    </Dialog>
  )
}
