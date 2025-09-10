import { ProfileSetup } from "@/components/profile-setup"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ホームに戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">プロフィール設定</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <ProfileSetup />
        </div>
      </div>
    </main>
  )
}