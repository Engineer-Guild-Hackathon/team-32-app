"use client"

import { useState } from "react"
import { DressUpEditor } from "@/components/dress-up-editor"
import { OutfitEvaluator } from "@/components/outfit-evaluator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  return (
    <main className="min-h-screen bg-background">
      {/* スマートフォン用ヘッダー */}
      <div className="sticky top-0 z-50 bg-background border-b">
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

          {/* 空のスペース */}
          <div className="w-10"></div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-4 py-4">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100">
            <TabsTrigger value="editor" className="text-sm font-medium">
              着せ替えエディター
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="text-sm font-medium">
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
  )
}
