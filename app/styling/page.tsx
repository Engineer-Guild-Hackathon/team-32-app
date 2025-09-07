import { ClothingManager } from "@/components/clothing-manager"
import { DressUpEditor } from "@/components/dress-up-editor"
import { FeedbackAnalyzer } from "@/components/feedback-analyzer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StylingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              プロフィール設定に戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">スタイリング & 着せ替え</h1>
            <p className="text-muted-foreground">服を登録して、着せ替えを楽しみましょう</p>
          </div>
        </div>

        <Tabs defaultValue="clothing" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="clothing">服アイテム管理</TabsTrigger>
            <TabsTrigger value="editor">着せ替えエディター</TabsTrigger>
            <TabsTrigger value="feedback">スタイル分析</TabsTrigger>
          </TabsList>

          <TabsContent value="clothing">
            <ClothingManager />
          </TabsContent>

          <TabsContent value="editor">
            <DressUpEditor />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackAnalyzer />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
