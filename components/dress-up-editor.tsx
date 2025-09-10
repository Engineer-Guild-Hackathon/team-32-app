"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  EyeOff,
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
  zIndex: number
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
      zIndex: placedItems.length + 1,
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
          zIndex: placedItems.length + 1,
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
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">着せ替えエディター</h2>
          <p className="text-muted-foreground mt-2">
            あなたの写真に服をコーディネートして、スタイリングを楽しみましょう
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setPlacedItems([])
            setGeneratedDressUpImage(null)
            setUserPhoto(originalUserPhoto) // 元の写真に戻す
          }}>
            <RotateCcw className="w-4 h-4 mr-2" />
            リセット
          </Button>
          {generatedDressUpImage && (
            <Button variant="outline" onClick={() => {
              setGeneratedDressUpImage(null)
              setUserPhoto(originalUserPhoto) // 元の写真に戻す
              setPlacedItems([]) // アイテムもクリア
            }}>
              <Eye className="w-4 h-4 mr-2" />
              元の画像に戻る
            </Button>
          )}
          <Button 
            onClick={handleGenerateDressUpImage}
            disabled={isGeneratingDressUp || placedItems.length === 0}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGeneratingDressUp ? "生成中..." : "AIで着せ替え画像生成"}
          </Button>
          <Button onClick={exportOutfit}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Clothing Items Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">服アイテム</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                服をドラッグして人物にドロップするか、クリックして追加
              </p>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as ClothingCategory)}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <TabsTrigger key={key} value={key} className="text-xs">
                        <Icon className="w-3 h-3 mr-1" />
                        {config.name}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {Object.entries(categoryConfig).map(([key, config]) => (
                  <TabsContent key={key} value={key} className="space-y-2">
                    {getItemsByCategory(key as ClothingCategory).map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-lg hover:bg-accent/50 cursor-grab transition-all duration-200 ${
                          isDragging ? 'opacity-50 scale-95' : ''
                        }`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={handleDragEnd}
                        onClick={() => addClothingItem(item)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {item.generatedImageUrl ? (
                              <img
                                src={item.generatedImageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Upload className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.color}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Main Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">着せ替えキャンバス</CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCanvasScale(Math.max(0.5, canvasScale - 0.1))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{Math.round(canvasScale * 100)}%</span>
                  <Button size="sm" variant="outline" onClick={() => setCanvasScale(Math.min(2, canvasScale + 0.1))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!userPhoto ? (
                <div className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="user-photo" />
                  <label htmlFor="user-photo" className="cursor-pointer text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">写真をアップロード</p>
                    <p className="text-sm text-muted-foreground">着せ替えに使用する写真を選択してください</p>
                  </label>
                </div>
              ) : generatedDressUpImage ? (
                /* 生成された画像を表示（ドラッグ&ドロップ機能付き） */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-primary">✨ AI生成画像</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setGeneratedDressUpImage(null)
                        setUserPhoto(originalUserPhoto) // 元の写真に戻す
                        setPlacedItems([]) // アイテムもクリア
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      元の画像に戻る
                    </Button>
                  </div>
                  <div
                    className={`relative aspect-[3/4] border rounded-lg overflow-hidden bg-muted transition-all duration-200 ${
                      isDragOver ? 'border-primary border-4 bg-primary/5 scale-105' : ''
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
                          <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                          <p className="font-medium">新しい着せ替え画像を生成中...</p>
                          <p className="text-sm opacity-80">しばらくお待ちください</p>
                        </div>
                      </div>
                    )}
                    
                    {/* ドロップ時のオーバーレイ */}
                    {isDragOver && !isGeneratingDressUp && (
                      <div className="absolute inset-0 bg-primary/20 border-4 border-primary border-dashed flex items-center justify-center">
                        <div className="text-center text-primary">
                          <Sparkles className="w-8 h-8 mx-auto mb-2" />
                          <p className="font-medium">ここに服をドロップ</p>
                          <p className="text-sm opacity-80">新しい着せ替え画像を生成します</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 元の画像とドラッグ&ドロップ機能を表示 */
                <div
                  ref={canvasRef}
                  className={`relative aspect-[3/4] border rounded-lg overflow-hidden bg-muted transition-all duration-200 ${
                    isDragOver ? 'border-primary border-4 bg-primary/5 scale-105' : ''
                  }`}
                  style={{ transform: `scale(${canvasScale})`, transformOrigin: "top left" }}
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
                        <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                        <p className="font-medium">着せ替え画像を生成中...</p>
                        <p className="text-sm opacity-80">しばらくお待ちください</p>
                      </div>
                    </div>
                  )}
                  
                  {/* ドロップ時のオーバーレイ */}
                  {isDragOver && !isGeneratingDressUp && (
                    <div className="absolute inset-0 bg-primary/20 border-4 border-primary border-dashed flex items-center justify-center">
                      <div className="text-center text-primary">
                        <Sparkles className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-medium">ここに服をドロップ</p>
                        <p className="text-sm opacity-80">着せ替え画像を生成します</p>
                      </div>
                    </div>
                  )}

                  {placedItems
                    .filter((item) => item.visible)
                    .sort((a, b) => a.zIndex - b.zIndex)
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
                          zIndex: placedItem.zIndex,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, placedItem.id)}
                      >
                        <div className="w-20 h-20 bg-primary/20 border-2 border-primary/50 rounded flex items-center justify-center">
                          <span className="text-xs text-center px-1">{placedItem.item.name}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-4 h-4" />
                レイヤー管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {placedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">アイテムを追加してください</p>
              ) : (
                <div className="space-y-2">
                  {placedItems
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          selectedItem === item.id ? "bg-accent border-primary" : "hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedItem(item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{item.item.name}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                updatePlacedItem(item.id, { visible: !item.visible })
                              }}
                            >
                              {item.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                removePlacedItem(item.id)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {selectedPlacedItem && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm">アイテム調整</h4>

                  <div>
                    <Label className="text-xs">サイズ</Label>
                    <Slider
                      value={[selectedPlacedItem.scale]}
                      onValueChange={([value]) => updatePlacedItem(selectedPlacedItem.id, { scale: value })}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">回転</Label>
                    <Slider
                      value={[selectedPlacedItem.rotation]}
                      onValueChange={([value]) => updatePlacedItem(selectedPlacedItem.id, { rotation: value })}
                      min={-180}
                      max={180}
                      step={15}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">レイヤー順序</Label>
                    <Select
                      value={selectedPlacedItem.zIndex.toString()}
                      onValueChange={(value) =>
                        updatePlacedItem(selectedPlacedItem.id, { zIndex: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: placedItems.length }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            レイヤー {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
