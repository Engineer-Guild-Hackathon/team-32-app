import { DressUpEditor } from "@/components/dress-up-editor"
import { OutfitEvaluator } from "@/components/outfit-evaluator"
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
            <h1 className="text-3xl font-bold text-foreground">着せ替え & 画像評価</h1>
            <p className="text-muted-foreground">登録した服で着せ替えを楽しみ、AIで画像を評価しましょう</p>
          </div>
        </div>

        <Tabs defaultValue="editor" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="editor">着せ替えエディター</TabsTrigger>
            <TabsTrigger value="evaluation">着せ替え評価</TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <DressUpEditor />
          </TabsContent>

          <TabsContent value="evaluation">
            <OutfitEvaluator imageUrl="" />
          </TabsContent>
        </Tabs>

        <div className="max-w-6xl mx-auto mt-8">
          <Link href="/clothing">
            <Button variant="outline" className="w-full">
              服アイテム管理に戻る
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
