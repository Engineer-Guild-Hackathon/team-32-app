"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { User, Shirt, Sparkles } from "lucide-react"
import { BackgroundProvider, MobilePageBackground } from "@/components/mobile-background-provider"
import { AppSidebar } from "@/components/app-sidebar"

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <BackgroundProvider>
      <MobilePageBackground>
        <main className="min-h-screen">
          {/* スマートフォン用ヘッダー */}
          <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-white/20">
            <div className="flex items-center justify-between px-4 py-3">
              {/* ハンバーガーメニュー */}
              <AppSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

              {/* タイトル */}
              <h1 className="text-lg font-bold text-foreground">#Fit Check</h1>

              {/* 空のスペース */}
              <div className="w-10"></div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">#Fit Check</h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto px-4">
                「似合う」を学ぶFashion app
              </p>
            </div>

        <div className="max-w-4xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/95 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-gray-800">プロフィール登録</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/profile">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  プロフィールを設定
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/95 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <Shirt className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-gray-800">服の登録</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/clothing">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  服を登録する
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/95 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-gray-800">Fit＆Check</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/styling">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  Fit＆Checkを始める
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
          </div>
        </main>
      </MobilePageBackground>
    </BackgroundProvider>
  )
}
