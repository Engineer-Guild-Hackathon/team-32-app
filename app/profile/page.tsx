"use client"

import { useState } from "react"
import { ProfileSetup } from "@/components/profile-setup"
import { BackgroundProvider, MobilePageBackground } from "@/components/mobile-background-provider"
import { AppSidebar } from "@/components/app-sidebar"

export default function ProfilePage() {
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
              <h1 className="text-lg font-bold text-foreground">プロフィール設定</h1>

              {/* 空のスペース */}
              <div className="w-10"></div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <ProfileSetup />
            </div>
          </div>
        </main>
      </MobilePageBackground>
    </BackgroundProvider>
  )
}