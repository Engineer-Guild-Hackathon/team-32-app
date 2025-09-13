"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Plus, Sparkles } from "lucide-react"
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

  const handleClose = () => {
    setIsOpen(false)
    setSelectedPhoto(null)
    setSelectedPhotoPreview(null)
    setAiPrompt("")
    setGeneratedImageUrl(null)
    setGeneratedImageFile(null)
    setSelectedCategory(defaultCategory)
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              写真をアップロード
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AIで生成
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label htmlFor="category-upload">カテゴリー *</Label>
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