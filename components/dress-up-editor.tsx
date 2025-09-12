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
  Star,
} from "lucide-react"
import { generateDressUpImageFromImages } from "@/lib/gemini"
import { useClothingItems } from "@/hooks/use-clothing-items"
import type { ClothingCategory, ClothingItem } from "@/lib/types/clothing"
import { OutfitEvaluationGemini } from "@/components/outfit-evaluation-gemini"

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

export function DressUpEditor() {
  const { items: clothingItems, isLoading } = useClothingItems()
  
  // デバッグ用ログ
  console.log('DressUpEditor - clothingItems:', clothingItems)
  console.log('DressUpEditor - isLoading:', isLoading)
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
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isTouchDragging, setIsTouchDragging] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [tpo, setTpo] = useState<string>('')

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
    const items = clothingItems.filter((item) => item.category === category)
    console.log(`カテゴリ ${category} のアイテム:`, items)
    return items
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
      console.log('No items to generate');
      return;
    }

    if (!originalUserPhoto) {
      alert('まず写真をアップロードしてください');
      return;
    }

    // 服の画像URLを事前に検証
    const clothingImageUrls = itemsToGenerate
      .map(placedItem => placedItem.item.imageUrl)
      .filter((url): url is string => url !== undefined && url.trim() !== '');

    if (clothingImageUrls.length === 0) {
      alert('有効な服の画像が見つかりません');
      return;
    }

    console.log('Starting image generation with:', {
      userPhoto: originalUserPhoto.name,
      clothingItems: clothingImageUrls.length,
      generatedImage: generatedDressUpImage ? 'exists' : 'none'
    });

    setIsGeneratingDressUp(true);
    try {

      // 画像URLをデータURLに変換
      console.log('服の画像URLを取得:', clothingImageUrls);
      const clothingImages = await Promise.all(
        clothingImageUrls.map(async (url, index) => {
          try {
            console.log(`画像 ${index + 1} を取得中:`, url);
            
            // 認証が必要なAPIエンドポイントの場合、適切なヘッダーを追加
            const headers: HeadersInit = {};
            
            // Supabaseの認証トークンを取得
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
              if (response.status === 401) {
                throw new Error(`認証が必要です。ログインしてください。`);
              } else if (response.status === 404) {
                throw new Error(`画像が見つかりません: ${url}`);
              } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
            }
            
            const blob = await response.blob();
            console.log(`画像 ${index + 1} のBlob:`, blob.type, blob.size);
            
            // MIMEタイプを検証
            const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
            if (!SUPPORTED_IMAGE_TYPES.includes(blob.type)) {
              throw new Error(`Unsupported image type: ${blob.type}. Expected JPEG, PNG, or WebP.`);
            }
            
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                console.log(`画像 ${index + 1} のデータURL形式:`, dataUrl.substring(0, 50) + '...');
                resolve(dataUrl);
              };
              reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error('Failed to fetch clothing image:', url, error);
            
            // より詳細なエラーメッセージを提供
            if (error instanceof Error) {
              throw new Error(`服の画像取得に失敗しました (${index + 1}番目): ${error.message}`);
            } else {
              throw new Error(`服の画像取得に失敗しました (${index + 1}番目): ${url}`);
            }
          }
        })
      );
      console.log('変換された服の画像データ:', clothingImages.length, '個');

      // 生成された画像がある場合は、それを基準に新しい画像を生成
      // ない場合は元の写真を基準にする
      let baseImage: File;
      
      if (generatedDressUpImage) {
        try {
          baseImage = await convertDataUrlToFile(generatedDressUpImage);
        } catch (error) {
          console.error('Failed to convert generated image to File:', error);
          // 生成画像の変換に失敗した場合は元の写真を使用
          if (!originalUserPhoto) {
            throw new Error('元の写真が見つかりません');
          }
          baseImage = originalUserPhoto;
        }
      } else {
        if (!originalUserPhoto) {
          throw new Error('元の写真が見つかりません');
        }
        baseImage = originalUserPhoto;
      }
      
      const result = await generateDressUpImageFromImages(baseImage, clothingImages);
      
      if (result.success && result.imageUrl) {
        setGeneratedDressUpImage(result.imageUrl);
      } else {
        alert(`着せ替え画像生成に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating dress-up image:', error);
      
      // より具体的なエラーメッセージを提供
      let errorMessage = '着せ替え画像生成中にエラーが発生しました';
      
      if (error instanceof Error) {
        if (error.message.includes('認証が必要')) {
          errorMessage = 'ログインが必要です。ページを再読み込みしてログインしてください。';
        } else if (error.message.includes('画像が見つかりません')) {
          errorMessage = '服の画像が見つかりません。服を再追加してください。';
        } else if (error.message.includes('元の写真が見つかりません')) {
          errorMessage = '元の写真が見つかりません。写真を再アップロードしてください。';
        } else if (error.message.includes('Invalid data URL')) {
          errorMessage = '画像データの形式が正しくありません。';
        } else {
          errorMessage = `エラー: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsGeneratingDressUp(false);
    }
  }

  // DataURLをFileオブジェクトに変換するヘルパー関数
  const convertDataUrlToFile = async (dataUrl: string): Promise<File> => {
    try {
      // DataURLの形式を検証
      if (!dataUrl || !dataUrl.startsWith('data:')) {
        throw new Error('Invalid data URL format');
      }
      
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data URL: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Empty blob received');
      }
      
      // MIMEタイプを検証
      const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      if (!SUPPORTED_IMAGE_TYPES.includes(blob.type)) {
        throw new Error(`Unsupported image type: ${blob.type}`);
      }
      
      return new File([blob], 'generated-image.png', { type: blob.type });
    } catch (error) {
      console.error('Error converting data URL to File:', error);
      throw error;
    }
  }

  // ドラッグ&ドロップ関連のハンドラー
  const handleDragStart = (e: React.DragEvent, item: ClothingItem) => {
    e.dataTransfer.setData('clothing-item', JSON.stringify(item))
    e.dataTransfer.effectAllowed = 'copy'
    setIsDragging(true)
    
    // ドラッグ中の視覚的フィードバックを改善
    if (e.dataTransfer.setDragImage) {
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
      dragImage.style.transform = 'rotate(5deg)'
      dragImage.style.opacity = '0.8'
      document.body.appendChild(dragImage)
      e.dataTransfer.setDragImage(dragImage, 50, 50)
      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setIsDragOver(false)
  }

  // タッチデバイス対応のハンドラー
  const handleTouchStart = (e: React.TouchEvent, item: ClothingItem) => {
    // スマホでのスクロールを妨げないように、preventDefaultは最小限に
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    setIsTouchDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos || !isTouchDragging) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartPos.x
    const deltaY = touch.clientY - touchStartPos.y
    
    // 一定距離以上移動した場合のみドラッグとみなす
    if (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15) {
      // ドラッグ中はスクロールを防止
      e.preventDefault()
      // タッチドラッグの視覚的フィードバック
      document.body.style.cursor = 'grabbing'
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, item: ClothingItem) => {
    if (!touchStartPos || !isTouchDragging) return
    
    e.preventDefault()
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartPos.x
    const deltaY = touch.clientY - touchStartPos.y
    
    // タップとドラッグを区別（移動距離が小さい場合はタップとして処理）
    if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      // タップ: アイテムを追加
      addClothingItem(item)
    } else {
      // ドラッグ: キャンバス上にドロップされたかチェック
      const canvasElement = canvasRef.current
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect()
        const isOverCanvas = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                           touch.clientY >= rect.top && touch.clientY <= rect.bottom
        
        if (isOverCanvas) {
          // キャンバス上にドロップされた場合
          addClothingItem(item)
          // 自動的に画像生成を実行
          setTimeout(async () => {
            try {
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
              await generateDressUpImageDirectly(newPlacedItems)
            } catch (error) {
              console.error('Error in auto-generation after touch drop:', error)
            }
          }, 100)
        }
      }
    }
    
    setTouchStartPos(null)
    setIsTouchDragging(false)
    document.body.style.cursor = ''
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
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">読み込み中...</p>
                    </div>
                  </div>
                ) : (
                  Object.entries(categoryConfig).map(([key, config]) => (
                    <TabsContent key={key} value={key} className="h-full">
                      <div className="grid grid-cols-2 gap-1">
                        {getItemsByCategory(key as ClothingCategory).length === 0 ? (
                          <div className="col-span-2 flex items-center justify-center h-32 text-center">
                            <div>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">アイテムがありません</p>
                              <p className="text-xs text-gray-400">服登録ページでアイテムを追加してください</p>
                            </div>
                          </div>
                        ) : (
                          getItemsByCategory(key as ClothingCategory).map((item) => (
                            <div
                              key={item.id}
                              className={`p-1 border rounded hover:bg-accent/50 cursor-pointer transition-all duration-200 select-none ${
                                isDragging || isTouchDragging ? 'opacity-50 scale-95' : ''
                              } active:scale-95 active:bg-accent/70`}
                              onClick={() => addClothingItem(item)}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                              onDragEnd={handleDragEnd}
                              onTouchStart={(e) => handleTouchStart(e, item)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={(e) => handleTouchEnd(e, item)}
                            >
                              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={`アイテム ${item.id.slice(-4)}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.error('画像の読み込みに失敗しました:', item.imageUrl);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                      console.log('画像の読み込みに成功しました:', item.imageUrl);
                                    }}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center">
                                    <Upload className="w-4 h-4 text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-500">画像なし</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  ))
                )}
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
              {generatedDressUpImage && (
                <Button 
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowEvaluation(!showEvaluation)}
                  title="コーディネート評価"
                >
                  <Star className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              {!userPhoto ? (
                <div className="aspect-[3/4] w-full border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" id="user-photo" />
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
                            <span className="text-xs text-center px-1">アイテム {placedItem.item.id.slice(-4)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 評価機能エリア */}
          {showEvaluation && generatedDressUpImage && (
            <div className="border-t bg-gray-50 p-3 max-h-96 overflow-y-auto">
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  TPO（シーン）
                </label>
                <select
                  value={tpo}
                  onChange={(e) => setTpo(e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded"
                >
                  <option value="">選択してください</option>
                  <option value="カジュアル">カジュアル</option>
                  <option value="ビジネス">ビジネス</option>
                  <option value="フォーマル">フォーマル</option>
                  <option value="デート">デート</option>
                  <option value="パーティー">パーティー</option>
                  <option value="旅行">旅行</option>
                  <option value="スポーツ">スポーツ</option>
                </select>
              </div>
              <OutfitEvaluationGemini 
                imageData={generatedDressUpImage}
                tpo={tpo || undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

