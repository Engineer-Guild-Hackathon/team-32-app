import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { User, Shirt, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Fashion Diagnosis & Style Learning</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            パーソナル診断を通じて、あなたに最適なファッションスタイルを学びましょう
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <User className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle>プロフィール登録</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/profile">
                <Button className="w-full">
                  プロフィールを設定
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Shirt className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle>服の登録</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/clothing">
                <Button className="w-full">
                  服を登録する
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle>着せ替え & 分析</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/styling">
                <Button className="w-full">
                  着せ替えを始める
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
