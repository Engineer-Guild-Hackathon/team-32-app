"use client"

import Link from "next/link"
import { Menu, User, Shirt, Sparkles, Home, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface AppSidebarProps {
  isMenuOpen: boolean
  setIsMenuOpen: (open: boolean) => void
}

export function AppSidebar({ isMenuOpen, setIsMenuOpen }: AppSidebarProps) {
  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>メニュー</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="mt-6 space-y-4">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 py-3">
                <Home className="h-5 w-5" />
                ホーム
              </Button>
            </Link>
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 py-3">
                <User className="h-5 w-5" />
                プロフィール登録
              </Button>
            </Link>
            <Link href="/clothing" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 py-3">
                <Shirt className="h-5 w-5" />
                服登録
              </Button>
            </Link>
            <Link href="/styling" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 py-3">
                <Sparkles className="h-5 w-5" />
                Fit＆Check
              </Button>
            </Link>
            <Link href="/sns" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 py-3">
                <Users className="h-5 w-5" />
                SNS
              </Button>
            </Link>
          </div>
          <div className="flex-1"></div>
          <div className="border-t pt-4 pb-4">
            <div className="w-full" onClick={() => setIsMenuOpen(false)}>
              <LogoutButton />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}