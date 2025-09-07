"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Palette,
  User,
  Sparkles,
  Target,
} from "lucide-react"

type BodyType = "straight" | "wave" | "natural"
type PersonalColor = "spring" | "autumn" | "summer" | "winter"

interface UserProfile {
  bodyType: BodyType
  personalColor: PersonalColor
  photo?: File
}

interface OutfitItem {
  name: string
  category: string
  color: string
  brand?: string
}

interface FeedbackCriteria {
  colorHarmony: number
  bodyTypeCompatibility: number
  styleConsistency: number
  overallBalance: number
}

interface FeedbackResult {
  overallScore: number
  criteria: FeedbackCriteria
  goodPoints: string[]
  improvements: string[]
  recommendations: string[]
}

// Mock user profile and outfit data
const mockUserProfile: UserProfile = {
  bodyType: "straight",
  personalColor: "winter",
}

const mockOutfit: OutfitItem[] = [
  { name: "白いシャツ", category: "トップス", color: "ホワイト", brand: "UNIQLO" },
  { name: "デニムパンツ", category: "ボトムス", color: "ブルー", brand: "Levi's" },
  { name: "スニーカー", category: "シューズ", color: "ホワイト", brand: "Nike" },
  { name: "レザーバッグ", category: "小物", color: "ブラック", brand: "Coach" },
]

const criteriaConfig = {
  colorHarmony: {
    name: "カラーハーモニー",
    description: "パーソナルカラーとの調和",
    icon: Palette,
  },
  bodyTypeCompatibility: {
    name: "骨格適合性",
    description: "体型に合ったシルエット",
    icon: User,
  },
  styleConsistency: {
    name: "スタイル統一感",
    description: "全体的なテーマの一貫性",
    icon: Sparkles,
  },
  overallBalance: {
    name: "全体バランス",
    description: "プロポーションと調和",
    icon: Target,
  },
}

export function FeedbackAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null)

  const analyzeOutfit = async () => {
    setIsAnalyzing(true)

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock feedback generation based on user profile and outfit
    const result: FeedbackResult = generateMockFeedback(mockUserProfile, mockOutfit)

    setFeedbackResult(result)
    setIsAnalyzing(false)
  }

  const generateMockFeedback = (profile: UserProfile, outfit: OutfitItem[]): FeedbackResult => {
    // Mock analysis logic
    const colorHarmony = profile.personalColor === "winter" ? 85 : 70
    const bodyTypeCompatibility = profile.bodyType === "straight" ? 90 : 75
    const styleConsistency = 80
    const overallBalance = 85

    const overallScore = Math.round((colorHarmony + bodyTypeCompatibility + styleConsistency + overallBalance) / 4)

    return {
      overallScore,
      criteria: {
        colorHarmony,
        bodyTypeCompatibility,
        styleConsistency,
        overallBalance,
      },
      goodPoints: [
        "ブルベウィンターに最適な白と黒の組み合わせが美しく調和しています",
        "ストレート体型に適したシンプルで直線的なシルエットが活かされています",
        "カジュアルながらも上品さを保った統一感のあるスタイリングです",
      ],
      improvements: [
        "デニムの色味をより深いインディゴにすることで、よりシャープな印象になります",
        "アクセサリーを追加することで、より洗練された印象を演出できます",
      ],
      recommendations: [
        "同じ色合いでテーラードジャケットを羽織ると、よりフォーマルな場面にも対応できます",
        "足元をローファーに変えることで、大人っぽい印象をプラスできます",
        "シルバーアクセサリーを追加すると、ブルベウィンターの魅力がより引き立ちます",
      ],
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "優秀"
    if (score >= 60) return "良好"
    return "要改善"
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">スタイル分析</h2>
        <p className="text-muted-foreground text-pretty max-w-2xl mx-auto">
          AIがあなたのコーディネートを4つの観点から分析し、パーソナライズされたフィードバックを提供します
        </p>
      </div>

      {/* Current Outfit Display */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            現在のコーディネート
          </CardTitle>
          <CardDescription>分析対象のアイテム一覧</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockOutfit.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-full aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.color}</p>
                {item.brand && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {item.brand}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button onClick={analyzeOutfit} disabled={isAnalyzing} size="lg">
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  スタイル分析を開始
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Results */}
      {feedbackResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">総合スコア</CardTitle>
              <div className={`text-6xl font-bold ${getScoreColor(feedbackResult.overallScore)}`}>
                {feedbackResult.overallScore}
                <span className="text-2xl ml-2">/ 100</span>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {getScoreLabel(feedbackResult.overallScore)}
              </Badge>
            </CardHeader>
          </Card>

          {/* Detailed Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>詳細評価</CardTitle>
              <CardDescription>4つの評価項目別スコア</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(feedbackResult.criteria).map(([key, score]) => {
                const config = criteriaConfig[key as keyof FeedbackCriteria]
                const Icon = config.icon
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(score)}`}>{score}点</span>
                    </div>
                    <Progress value={score} className="h-2" />
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Good Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                良い点
              </CardTitle>
              <CardDescription>現在のコーディネートの優れている部分</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedbackResult.goodPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-5 h-5" />
                改善点
              </CardTitle>
              <CardDescription>より良いスタイリングのための提案</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedbackResult.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Lightbulb className="w-5 h-5" />
                おすすめ提案
              </CardTitle>
              <CardDescription>あなたに似合うスタイリングのアイデア</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedbackResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setFeedbackResult(null)}>
              新しい分析
            </Button>
            <Button>
              <TrendingUp className="w-4 h-4 mr-2" />
              改善案を適用
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
