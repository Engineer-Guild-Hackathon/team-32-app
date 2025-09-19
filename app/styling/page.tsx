"use client"

import { useState } from "react"
import { DressUpEditor } from "@/components/dress-up-editor"
import { OutfitEvaluator } from "@/components/outfit-evaluator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackgroundProvider, MobilePageBackground, MobileBackgroundSelector } from "@/components/mobile-background-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ClothingItem } from "@/lib/types/clothing"

export default function StylingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const [generatedDressUpImage, setGeneratedDressUpImage] = useState<string | null>(null)
  const [generatedItems, setGeneratedItems] = useState<ClothingItem[]>([])

  return (
    <BackgroundProvider>
      <MobilePageBackground>
        <main className="min-h-screen">
          {/* スマートフォン用ヘッダー */}
          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* ハンバーガーメニュー */}
          <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

          {/* タイトル */}
          <h1 className="text-lg font-bold text-foreground">#Fit＆Check</h1>

          {/* 背景選択ボタン */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
            onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          </div>
          </div>

          {/* 背景選択パネル */}
          {showBackgroundSelector && (
            <div className="px-4 py-2 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 shadow-sm">
              <MobileBackgroundSelector />
            </div>
          )}

          {/* メインコンテンツ */}
          <div className="px-4 py-4">
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/95 backdrop-blur-sm border-2 border-gray-200 shadow-sm">
                <TabsTrigger 
                  value="editor" 
                  className="text-sm font-medium data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white/70"
                >
                  Fit
                </TabsTrigger>
                <TabsTrigger 
                  value="evaluation" 
                  className="text-sm font-medium data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white/70"
                >
                  Check
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                <DressUpEditor 
                  onImageGenerated={setGeneratedDressUpImage} 
                  onItemsUsed={setGeneratedItems}
                />
              </TabsContent>

              <TabsContent value="evaluation">
                <OutfitEvaluator 
                  imageUrl={generatedDressUpImage || undefined} 
                  selectedItems={generatedItems}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </MobilePageBackground>
    </BackgroundProvider>
  )
}
