"use client"

import { useState } from "react"
import { DressUpEditor } from "@/components/dress-up-editor"
import { OutfitEvaluator } from "@/components/outfit-evaluator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackgroundProvider, MobilePageBackground, MobileBackgroundSelector } from "@/components/mobile-background-provider"
import Link from "next/link"
import { Menu, User, Shirt, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function StylingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)

  return (
    <BackgroundProvider>
      <MobilePageBackground>
        <main className="min-h-screen">
          {/* スマートフォン用ヘッダー */}
          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* ハンバーガーメニュー */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>メニュー</SheetTitle>
                <SheetDescription>
                  アプリの各機能にアクセスできます
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    プロフィール登録
                  </Button>
                </Link>
                <Link href="/clothing" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Shirt className="h-4 w-4" />
                    服登録
                  </Button>
                </Link>
                <Link href="/styling" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Sparkles className="h-4 w-4" />
                    着せ替え＆評価
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          {/* タイトル */}
          <h1 className="text-lg font-bold text-foreground">着せ替え＆評価</h1>

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
                  着せ替えエディター
                </TabsTrigger>
                <TabsTrigger 
                  value="evaluation" 
                  className="text-sm font-medium data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white/70"
                >
                  着せ替え評価
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                <DressUpEditor />
              </TabsContent>

              <TabsContent value="evaluation">
                <OutfitEvaluator />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </MobilePageBackground>
    </BackgroundProvider>
  )
}
