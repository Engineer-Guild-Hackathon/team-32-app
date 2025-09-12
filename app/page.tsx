"use client"

import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { User, Shirt, Sparkles } from "lucide-react"
import { BackgroundProvider, MobilePageBackground } from "@/components/mobile-background-provider"

export default function Home() {
  return (
    <BackgroundProvider>
      <MobilePageBackground>
        <main className="min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-end mb-4">
              <LogoutButton />
            </div>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">#Fit Check</h1>
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
              <CardTitle className="text-gray-800">着せ替え & 分析</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/styling">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  着せ替えを始める
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
