"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Save,
  Shirt,
  Package,
  Footprints,
  Watch,
  Sparkles,
} from "lucide-react"
import { generateDressUpImage } from "@/lib/gemini"

type ClothingCategory = "tops" | "bottoms" | "shoes" | "accessories"

interface ClothingItem {
  id: string
  name: string
  category: ClothingCategory
  color: string
  brand?: string
  photo?: File
  generatedImageUrl?: string
  tags: string[]
}

interface PlacedItem {
  id: string
  clothingId: string
  x: number
  y: number
  scale: number
  rotation: number
  visible: boolean
  item: ClothingItem
}

const categoryConfig = {
  tops: { name: "トップス", icon: Shirt },
  bottoms: { name: "ボトムス", icon: Package },
  shoes: { name: "シューズ", icon: Footprints },
  accessories: { name: "小物", icon: Watch },
}

// Mock data for demonstration
const mockClothingItems: ClothingItem[] = [
  {
    id: "1",
    name: "白いシャツ",
    category: "tops",
    color: "ホワイト",
    brand: "UNIQLO",
    tags: ["カジュアル", "オフィス"],
  },
  {
    id: "2",
    name: "デニムパンツ",
    category: "bottoms",
    color: "ブルー",
    brand: "Levi's",
    tags: ["カジュアル"],
  },
  {
    id: "3",
    name: "スニーカー",
    category: "shoes",
    color: "ホワイト",
    brand: "Nike",
    tags: ["スポーツ", "カジュアル"],
  },
  {
    id: "4",
    name: "レザーバッグ",
    category: "accessories",
    color: "ブラック",
    brand: "Coach",
    tags: ["フォーマル", "ビジネス"],
  },
]

export function DressUpEditor() {
  const [userPhoto, setUserPhoto] = useState<File | null>(null)
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>("tops")
  const [canvasScale, setCanvasScale] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isGeneratingDressUp, setIsGeneratingDressUp] = useState(false)
  const [generatedDressUpImage, setGeneratedDressUpImage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [originalUserPhoto, setOriginalUserPhoto] = useState<File | null>(null)

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUserPhoto(file)
      setOriginalUserPhoto(file) // 元の写真も保存
    }
  }

  const addClothingItem = (item: ClothingItem) => {
    const newPlacedItem: PlacedItem = {
      id: `placed-${Date.now()}`,
      clothingId: item.id,
      x: 200,
      y: 200,
      scale: 1,
      rotation: 0,
      visible: true,
      item,
    }
    setPlacedItems((prev) => [...prev, newPlacedItem])
    setSelectedItem(newPlacedItem.id)
    
    // 新しい服を追加した際は、生成された画像をクリアしない
    // 生成中も前回の画像を表示し続ける
  }

  const updatePlacedItem = (id: string, updates: Partial<PlacedItem>) => {
    setPlacedItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  const removePlacedItem = (id: string) => {
    setPlacedItems((prev) => prev.filter((item) => item.id !== id))
    if (selectedItem === id) {
      setSelectedItem(null)
    }
    
    // 服を削除した際は、生成された画像をクリアしない
    // 生成中も前回の画像を表示し続ける
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault()
      setSelectedItem(itemId)

      const item = placedItems.find((p) => p.id === itemId)
      if (!item) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const startX = e.clientX - rect.left
      const startY = e.clientY - rect.top

      setDragOffset({
        x: startX - item.x,
        y: startY - item.y,
      })

      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left - dragOffset.x
        const y = e.clientY - rect.top - dragOffset.y

        updatePlacedItem(itemId, { x, y })
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [placedItems, dragOffset],
  )

  const selectedPlacedItem = placedItems.find((item) => item.id === selectedItem)

  const getItemsByCategory = (category: ClothingCategory) => {
    return mockClothingItems.filter((item) => item.category === category)
  }

  const exportOutfit = () => {
    // In a real implementation, this would capture the canvas and save as image
    console.log("Exporting outfit:", placedItems)
    alert("コーディネートを保存しました！")
  }

  const handleGenerateDressUpImage = async () => {
    if (placedItems.length === 0) {
      alert('着せ替えアイテムを追加してください');
      return;
    }

    await generateDressUpImageDirectly(placedItems);
  }

  const generateDressUpImageDirectly = async (itemsToGenerate: PlacedItem[]) => {
    if (itemsToGenerate.length === 0) {
      return;
    }

    if (!originalUserPhoto) {
      alert('まず写真をアップロードしてください');
      return;
    }

    setIsGeneratingDressUp(true);
    try {
      const items = itemsToGenerate.map(placedItem => ({
        name: placedItem.item.name,
        color: placedItem.item.color,
        brand: placedItem.item.brand,
      }));

      // 生成された画像がある場合は、それを基準に新しい画像を生成
      // ない場合は元の写真を基準にする
      const baseImage = generatedDressUpImage ? await convertDataUrlToFile(generatedDressUpImage) : originalUserPhoto;
      
      const result = await generateDressUpImage(items, baseImage);
      
      if (result.success && result.imageUrl) {
        setGeneratedDressUpImage(result.imageUrl);
      } else {
        alert(`着せ替え画像生成に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating dress-up image:', error);
      alert('着せ替え画像生成中にエラーが発生しました');
    } finally {
      setIsGeneratingDressUp(false);
    }
  }

  // DataURLをFileオブジェクトに変換するヘルパー関数
  const convertDataUrlToFile = async (dataUrl: string): Promise<File> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], 'generated-image.png', { type: 'image/png' });
  }

  // ドラッグ&ドロップ関連のハンドラー
  const handleDragStart = (e: React.DragEvent, item: ClothingItem) => {
    e.dataTransfer.setData('clothing-item', JSON.stringify(item))
    e.dataTransfer.effectAllowed = 'copy'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    try {
      const clothingData = e.dataTransfer.getData('clothing-item')
      if (clothingData) {
        const item = JSON.parse(clothingData)
        addClothingItem(item)
        
        // 服を追加した後、自動的に画像生成を実行
        // placedItemsの更新を待つために、新しい配列を作成してから生成
        const newPlacedItems = [...placedItems, {
          id: `placed-${Date.now()}`,
          clothingId: item.id,
          x: 200,
          y: 200,
          scale: 1,
          rotation: 0,
          visible: true,
          item,
        }]
        
        setTimeout(async () => {
          try {
            await generateDressUpImageDirectly(newPlacedItems)
          } catch (error) {
            console.error('Error in auto-generation after drop:', error)
            alert('画像生成中にエラーが発生しました。手動で「AIで着せ替え画像生成」ボタンを押してください。')
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error in handleDrop:', error)
      alert('ドロップ処理中にエラーが発生しました')
    }
  }

  return (
    <div className="h-full flex bg-blue-50">
      {/* メインコンテンツ - 常に横並びレイアウト */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：クローゼットパネル */}
        <div className="w-1/2 border-r bg-white flex flex-col">
          <div className="px-3 py-2 border-b">
            <h2 className="text-sm font-bold">クローゼット</h2>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as ClothingCategory)} className="h-full flex flex-col">
              <div className="px-2 py-2">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 h-8">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <TabsTrigger key={key} value={key} className="text-xs gap-1 h-6">
                      <Icon className="w-3 h-3" />
                    </TabsTrigger>
                  )
                })}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2">
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <TabsContent key={key} value={key} className="h-full">
                    <div className="grid grid-cols-2 gap-1">
                      {getItemsByCategory(key as ClothingCategory).map((item) => (
                        <div
                          key={item.id}
                          className="p-1 border rounded hover:bg-accent/50 cursor-pointer transition-all duration-200"
                          onClick={() => addClothingItem(item)}
                        >
                          <div className="aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden mb-1">
                            {item.generatedImageUrl ? (
                              <img
                                src={item.generatedImageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Upload className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="font-medium text-xs truncate text-center">{item.name}</p>
                          <Badge variant="secondary" className="text-xs w-full justify-center mt-1 h-4">
                            {item.color}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>

        {/* 右側：着せ替えキャンバス */}
        <div className="w-1/2 bg-white flex flex-col">
          <div className="px-3 py-2 border-b">
            <h2 className="text-sm font-bold">キャンバス</h2>
          </div>
          
          <div className="flex-1 p-2 flex flex-col">
            {/* 操作ボタン */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => setCanvasScale(Math.max(0.5, canvasScale - 0.1))}>
                <ZoomOut className="w-3 h-3" />
              </Button>
              <span className="text-xs text-gray-500">{Math.round(canvasScale * 100)}%</span>
              <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => setCanvasScale(Math.min(2, canvasScale + 0.1))}>
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 w-6 p-0"
                onClick={() => {
                  setPlacedItems([])
                  setGeneratedDressUpImage(null)
                  setUserPhoto(originalUserPhoto)
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              {generatedDressUpImage && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setGeneratedDressUpImage(null)
                    setUserPhoto(originalUserPhoto)
                    setPlacedItems([])
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                </Button>
              )}
              <Button 
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleGenerateDressUpImage}
                disabled={isGeneratingDressUp || placedItems.length === 0}
              >
                <Sparkles className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              {!userPhoto ? (
                <div className="aspect-[3/4] w-full border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="user-photo" />
                  <label htmlFor="user-photo" className="cursor-pointer text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium mb-1">写真をアップロード</p>
                    <p className="text-xs text-gray-500">着せ替えに使用する写真を選択してください</p>
                  </label>
                </div>
              ) : generatedDressUpImage ? (
                /* 生成された画像を表示（ドラッグ&ドロップ機能付き） */
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-primary">✨ AI生成画像</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-5 text-xs px-2"
                      onClick={() => {
                        setGeneratedDressUpImage(null)
                        setUserPhoto(originalUserPhoto)
                        setPlacedItems([])
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      元に戻る
                    </Button>
                  </div>
                  <div
                    className={`relative aspect-[3/4] border rounded overflow-hidden bg-gray-100 transition-all duration-200 ${
                      isDragOver ? 'border-primary border-2 bg-primary/5 scale-105' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <img
                      src={generatedDressUpImage}
                      alt="Generated dress-up"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 生成中のローディングオーバーレイ */}
                    {isGeneratingDressUp && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Sparkles className="w-6 h-6 mx-auto mb-1 animate-pulse" />
                          <p className="text-xs font-medium">新しい着せ替え画像を生成中...</p>
                          <p className="text-xs opacity-80">しばらくお待ちください</p>
                        </div>
                      </div>
                    )}
                    
                    {/* ドロップ時のオーバーレイ */}
                    {isDragOver && !isGeneratingDressUp && (
                      <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed flex items-center justify-center">
                        <div className="text-center text-primary">
                          <Sparkles className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-xs font-medium">ここに服をドロップ</p>
                          <p className="text-xs opacity-80">新しい着せ替え画像を生成します</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 元の画像とドラッグ&ドロップ機能を表示 */
                <div className="w-full">
                  <div
                    ref={canvasRef}
                    className={`relative aspect-[3/4] border rounded overflow-hidden bg-gray-100 transition-all duration-200 ${
                      isDragOver ? 'border-primary border-2 bg-primary/5 scale-105' : ''
                    }`}
                    style={{ transform: `scale(${canvasScale})`, transformOrigin: "center" }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <img
                      src={URL.createObjectURL(userPhoto) || "/placeholder.svg"}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 生成中のローディングオーバーレイ */}
                    {isGeneratingDressUp && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Sparkles className="w-6 h-6 mx-auto mb-1 animate-pulse" />
                          <p className="text-xs font-medium">着せ替え画像を生成中...</p>
                          <p className="text-xs opacity-80">しばらくお待ちください</p>
                        </div>
                      </div>
                    )}
                    
                    {/* ドロップ時のオーバーレイ */}
                    {isDragOver && !isGeneratingDressUp && (
                      <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed flex items-center justify-center">
                        <div className="text-center text-primary">
                          <Sparkles className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-xs font-medium">ここに服をドロップ</p>
                          <p className="text-xs opacity-80">着せ替え画像を生成します</p>
                        </div>
                      </div>
                    )}

                    {placedItems
                      .filter((item) => item.visible)
                      .map((placedItem) => (
                        <div
                          key={placedItem.id}
                          className={`absolute cursor-move select-none ${
                            selectedItem === placedItem.id ? "ring-2 ring-primary" : ""
                          }`}
                          style={{
                            left: placedItem.x,
                            top: placedItem.y,
                            transform: `scale(${placedItem.scale}) rotate(${placedItem.rotation}deg)`,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, placedItem.id)}
                        >
                          <div className="w-12 h-12 bg-primary/20 border-2 border-primary/50 rounded flex items-center justify-center">
                            <span className="text-xs text-center px-1">{placedItem.item.name}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

