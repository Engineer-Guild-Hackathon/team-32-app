"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Shirt,
  Package,
  Footprints,
  Watch,
  Sparkles,
  Star,
  User,
} from "lucide-react"
import { generateDressUpImageFromImages } from "@/lib/gemini"
import { useClothingItems } from "@/hooks/use-clothing-items"
import type { ClothingCategory, ClothingItem } from "@/lib/types/clothing"
import { OutfitEvaluationGemini } from "@/components/outfit-evaluation-gemini"
import { useRouter } from "next/navigation"
import { UsageConfirmationDialog } from "@/components/usage-confirmation-dialog"


const categoryConfig = {
  tops: { name: "トップス", icon: Shirt },
  bottoms: { name: "ボトムス", icon: Package },
  shoes: { name: "シューズ", icon: Footprints },
  accessories: { name: "小物", icon: Watch },
}

interface DressUpEditorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export function DressUpEditor({ onImageGenerated }: DressUpEditorProps = {}) {
  const { items: clothingItems, isLoading } = useClothingItems()
  const router = useRouter()

  // デバッグ用ログ
  console.log('DressUpEditor - clothingItems:', clothingItems)
  console.log('DressUpEditor - isLoading:', isLoading)
  const [userPhoto, setUserPhoto] = useState<File | null>(null)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const [selectedClothingItems, setSelectedClothingItems] = useState<ClothingItem[]>([])
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>("tops")
  const [canvasScale, setCanvasScale] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isGeneratingDressUp, setIsGeneratingDressUp] = useState(false)
  const [generatedDressUpImage, setGeneratedDressUpImage] = useState<string | null>(null)
  const [originalUserPhoto, setOriginalUserPhoto] = useState<File | null>(null)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [tpo, setTpo] = useState<string>('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // profilesテーブルからfull_body_image_pathを取得
  useEffect(() => {
    const loadUserPhoto = async () => {
      try {
        // APIルートを使用して全身画像を取得
        const response = await fetch('/api/full-body-image')

        if (response.ok) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          setUserPhotoUrl(url)

          // FileオブジェクトとしてもセットするためにBlobを使用
          // MIMEタイプが不明な場合はデフォルトでJPEGとして扱う
          const mimeType = blob.type && blob.type !== 'image/*' ? blob.type : 'image/jpeg'
          const fileName = mimeType.includes('png') ? 'user-photo.png' : 'user-photo.jpg'
          const file = new File([blob], fileName, { type: mimeType })
          setUserPhoto(file)
          setOriginalUserPhoto(file)
        } else if (response.status === 404) {
          // 画像が見つからない場合は何もしない（プロフィールへの誘導を表示）
          console.log('No full body image found in profile')
        } else {
          console.error('Failed to fetch full body image:', response.status)
        }
      } catch (error) {
        console.error('Error loading user photo:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadUserPhoto()
  }, [])

  const toggleClothingSelection = (item: ClothingItem) => {
    setSelectedClothingItems((prev) => {
      const exists = prev.find(selected => selected.id === item.id)
      if (exists) {
        return prev.filter(selected => selected.id !== item.id)
      } else {
        return [...prev, item]
      }
    })
  }



  const getItemsByCategory = (category: ClothingCategory) => {
    const items = clothingItems.filter((item) => item.category === category)
    console.log(`カテゴリ ${category} のアイテム:`, items)
    return items
  }

  const handleGenerateDressUpImage = async () => {
    if (selectedClothingItems.length === 0) {
      alert('着せ替えアイテムを選択してください');
      return;
    }

    setShowConfirmDialog(true);
  }

  const handleConfirmGenerate = async () => {
    await generateDressUpImageDirectly(selectedClothingItems);
  }

  const generateDressUpImageDirectly = async (clothingItems: ClothingItem[]) => {
    if (clothingItems.length === 0) {
      console.log('No items to generate');
      return;
    }

    if (!originalUserPhoto) {
      alert('まず写真をアップロードしてください');
      return;
    }

    // 服の画像URLを事前に検証
    const clothingImageUrls = clothingItems
      .map(item => item.imageUrl)
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
        // 親コンポーネントに生成された画像を通知
        onImageGenerated?.(result.imageUrl);
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

  return (
    <div className="h-full flex flex-col bg-blue-50">
      {/* メインコンテンツ - 縦並びレイアウト */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 上部：着せ替えキャンバス */}
        <div className="flex-1 bg-white flex flex-col border-b">
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
                  setSelectedClothingItems([])
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
                    setSelectedClothingItems([])
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="sm"
                className="h-6 text-xs px-2"
                onClick={handleGenerateDressUpImage}
                disabled={isGeneratingDressUp || selectedClothingItems.length === 0}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                生成
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
              {isLoadingProfile ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">プロフィール画像を読み込み中...</p>
                  </div>
                </div>
              ) : !userPhoto ? (
                <div className="aspect-[3/4] w-full border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center">
                  <User className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm font-medium mb-3">写真が登録されていません</p>
                  <p className="text-xs text-gray-500 mb-4">プロフィールページで写真を登録してください</p>
                  <Button
                    onClick={() => router.push('/profile')}
                    className="gap-2"
                  >
                    <User className="w-4 h-4" />
                    プロフィールへ移動
                  </Button>
                </div>
              ) : generatedDressUpImage ? (
                    /* 生成された画像を表示 */
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
                        setSelectedClothingItems([])
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      元に戻る
                    </Button>
                  </div>
                  <div
                        className="relative aspect-[3/4] border rounded overflow-hidden bg-gray-100"
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

                  </div>
                </div>
              ) : (
                      /* 元の画像を表示 */
                <div className="w-full">
                  <div
                    ref={canvasRef}
                          className="relative aspect-[3/4] border rounded overflow-hidden bg-gray-100"
                          style={{ transform: `scale(${canvasScale})`, transformOrigin: "center" }}
                  >
                    <img
                      src={userPhotoUrl || URL.createObjectURL(userPhoto) || "/placeholder.svg"}
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

        {/* 下部：クローゼットパネル */}
        <div className="h-80 border-t bg-white flex flex-col">
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
                      <div className="grid grid-cols-4 gap-2">
                        {getItemsByCategory(key as ClothingCategory).length === 0 ? (
                          <div className="col-span-4 flex items-center justify-center h-32 text-center">
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
                              className={`p-1 border rounded hover:bg-accent/50 cursor-pointer transition-all duration-200 select-none active:scale-95 active:bg-accent/70 ${
                                selectedClothingItems.find(selected => selected.id === item.id) ? 'ring-2 ring-primary bg-primary/10' : ''
                              }`}
                              onClick={() => toggleClothingSelection(item)}
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
      </div>

      <UsageConfirmationDialog
        isOpen={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmGenerate}
        title="AI着せ替え画像を生成しますか？"
        description="この機能を使用すると、1回分の利用回数を消費します。"
      />
    </div>
  )
}

