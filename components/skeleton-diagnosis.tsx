"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Sparkles
} from "lucide-react"

interface DiagnosisResult {
  frameType: 'straight' | 'wave' | 'natural'
  confidence: number
  reasoning: string
}

interface SkeletonDiagnosisProps {
  onComplete: (frameType: 'straight' | 'wave' | 'natural') => void
  onBack: () => void
}

const questions = [
  {
    id: 1,
    question: "上半身より下半身に厚みがありますか？",
    description: "鏡の前で横を向いた時、上半身と下半身の厚みを比較してください",
    yesDescription: "下半身に厚みがある",
    noDescription: "上半身の方が厚い"
  },
  {
    id: 2,
    question: "骨や節が太く筋張って目立ちますか？",
    description: "手首、足首、指の関節部分を確認してください",
    yesDescription: "骨や節が太く筋張っている",
    noDescription: "骨や節は細く繊細"
  },
  {
    id: 3,
    question: "肩回りが丸く腰の上に肉がつきますか？",
    description: "肩のラインと腰回りの肉のつき方を確認してください",
    yesDescription: "肩回りが丸く腰の上に肉がつく",
    noDescription: "肩回りは角張り腰回りはすっきり"
  },
  {
    id: 4,
    question: "首が短く鎖骨が出ませんか？",
    description: "首の長さと鎖骨の見え方を確認してください",
    yesDescription: "首が短く鎖骨が出ない",
    noDescription: "首が長く鎖骨が目立つ"
  },
  {
    id: 5,
    question: "手のひらが厚く丸いですか？",
    description: "手のひらの厚みと形を確認してください",
    yesDescription: "手のひらが厚く丸い",
    noDescription: "手のひらは薄く細長い"
  },
  {
    id: 6,
    question: "肩幅が目立ちますか？",
    description: "正面から見た時の肩幅の印象を確認してください",
    yesDescription: "肩幅が目立つ",
    noDescription: "肩幅は目立たない"
  }
]

const frameTypeInfo = {
  straight: {
    name: "ストレート",
    description: "肩幅と腰幅がほぼ同じで、ウエストのくびれが少ない体型",
    color: "blue",
    icon: "📏"
  },
  wave: {
    name: "ウェーブ",
    description: "上半身が華奢で、下半身にボリュームがある体型",
    color: "purple",
    icon: "🌊"
  },
  natural: {
    name: "ナチュラル",
    description: "骨格がしっかりしていて、筋肉質な印象の体型",
    color: "green",
    icon: "💪"
  }
}

export function SkeletonDiagnosis({ onComplete, onBack }: SkeletonDiagnosisProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<DiagnosisResult | null>(null)

  const getNextQuestion = (currentAnswers: boolean[], currentQIndex: number): number | null => {
    // フローチャートに基づく質問遷移
    if (currentQIndex === 0) {
      // 一問目後は一問目の回答によって分岐
      if (currentAnswers[0]) {
        // 一問目がYes→二問目は「骨や節が太く筋張って目立つ」（インデックス1）
        return 1
      } else {
        // 一問目がNo→二問目は「肩回りが丸く腰の上に肉がつく」（インデックス2）
        return 2
      }
    } else if (currentQIndex === 1) {
      // 二問目（骨や節）後は三問目へ
      if (currentAnswers[1]) {
        // 二問目がYes→三問目は「手のひらが厚く丸い」（インデックス4）
        return 4
      } else {
        // 二問目がNo→三問目は「肩幅が目立つ」（インデックス5）
        return 5
      }
    } else if (currentQIndex === 2) {
      // 二問目（肩回り）後は三問目へ
      // 三問目は「首が短く鎖骨が出ない」（インデックス3）
      return 3
    } else if (currentQIndex === 3 || currentQIndex === 4 || currentQIndex === 5) {
      // 三問目後は診断完了
      return null
    }
    return null
  }

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    const nextQuestionIndex = getNextQuestion(newAnswers, currentQuestion)
    
    if (nextQuestionIndex !== null) {
      setCurrentQuestion(nextQuestionIndex)
    } else {
      // 全ての質問に回答完了
      performDiagnosis(newAnswers)
    }
  }

  const performDiagnosis = async (finalAnswers: boolean[]) => {
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/skeleton-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question1: finalAnswers[0],
          question2: finalAnswers[1],
          question3: finalAnswers[2],
          question4: finalAnswers[3],
          question5: finalAnswers[4],
          question6: finalAnswers[5],
        }),
      })

      if (!response.ok) {
        throw new Error('診断に失敗しました')
      }

      const diagnosisResult = await response.json()
      setResult(diagnosisResult)
    } catch (error) {
      console.error('診断エラー:', error)
      // フォールバック: 詳細なロジックで判定
      const fallbackResult = getDetailedFallbackResult(finalAnswers)
      setResult(fallbackResult)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getDetailedFallbackResult = (answers: boolean[]): DiagnosisResult => {
    // フローチャートに基づく詳細な判定ロジック
    // 回答の順序: [一問目, 二問目, 三問目]
    const q1 = answers[0] // 上半身より下半身に厚みがある
    const q2 = answers[1] // 二問目の回答（骨や節 または 肩回り）
    const q3 = answers[2] // 三問目の回答（手のひら、首と鎖骨、または肩幅）

    if (q1) {
      // 一問目がYes→二問目は「骨や節が太く筋張って目立つ」
      if (q2) {
        // 二問目がYes→三問目は「手のひらが厚く丸い」
        if (q3) {
          // 三問目がYes→ストレート
          return {
            frameType: 'straight',
            confidence: 90,
            reasoning: '下半身に厚みがあり、骨や節が太く筋張って目立ち、手のひらが厚く丸い特徴から、ストレートタイプと判定されました。'
          }
        } else {
          // 三問目がNo→ナチュラル
          return {
            frameType: 'natural',
            confidence: 85,
            reasoning: '下半身に厚みがあり、骨や節が太く筋張って目立つが、手のひらは薄く細長い特徴から、ナチュラルタイプと判定されました。'
          }
        }
      } else {
        // 二問目がNo→三問目は「肩幅が目立つ」
        if (q3) {
          // 三問目がYes→ナチュラル
          return {
            frameType: 'natural',
            confidence: 85,
            reasoning: '下半身に厚みがあり、骨や節は細く繊細だが、肩幅が目立つ特徴から、ナチュラルタイプと判定されました。'
          }
        } else {
          // 三問目がNo→ウェーブ
          return {
            frameType: 'wave',
            confidence: 90,
            reasoning: '下半身に厚みがあり、骨や節は細く繊細で、肩幅も目立たない特徴から、ウェーブタイプと判定されました。'
          }
        }
      }
    } else {
      // 一問目がNo→二問目は「肩回りが丸く腰の上に肉がつく」
      if (q2) {
        // 二問目がYes→三問目は「首が短く鎖骨が出ない」
        if (q3) {
          // 三問目がYes→ストレート
          return {
            frameType: 'straight',
            confidence: 90,
            reasoning: '上半身の方が厚く、肩回りが丸く腰の上に肉がつき、首が短く鎖骨が出ない特徴から、ストレートタイプと判定されました。'
          }
        } else {
          // 三問目がNo→ウェーブ
          return {
            frameType: 'wave',
            confidence: 85,
            reasoning: '上半身の方が厚く、肩回りが丸く腰の上に肉がつくが、首が長く鎖骨が目立つ特徴から、ウェーブタイプと判定されました。'
          }
        }
      } else {
        // 二問目がNo→三問目は「手のひらが厚く丸い」
        if (q3) {
          // 三問目がYes→ストレート
          return {
            frameType: 'straight',
            confidence: 85,
            reasoning: '上半身の方が厚く、肩回りは角張り腰回りはすっきりし、手のひらが厚く丸い特徴から、ストレートタイプと判定されました。'
          }
        } else {
          // 三問目がNo→ウェーブ
          return {
            frameType: 'wave',
            confidence: 90,
            reasoning: '上半身の方が厚く、肩回りは角張り腰回りはすっきりし、手のひらは薄く細長い特徴から、ウェーブタイプと判定されました。'
          }
        }
      }
    }
  }

  const handleConfirmResult = () => {
    if (result) {
      onComplete(result.frameType)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setAnswers(answers.slice(0, -1))
    } else {
      onBack()
    }
  }

  // 質問の進行度を計算（常に3問で完了）
  const getQuestionNumber = (questionIndex: number): number => {
    if (questionIndex === 0) return 1 // 一問目
    if (questionIndex === 1 || questionIndex === 2) return 2 // 二問目
    if (questionIndex === 3 || questionIndex === 4 || questionIndex === 5) return 3 // 三問目
    return 1
  }
  
  const progress = (getQuestionNumber(currentQuestion) / 3) * 100

  if (isAnalyzing) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">診断中...</h3>
          <p className="text-gray-600 mb-4">あなたの回答を分析しています</p>
          <Progress value={100} className="w-full" />
        </CardContent>
      </Card>
    )
  }

  if (result) {
    const frameInfo = frameTypeInfo[result.frameType]
    
    return (
      <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl mx-2 sm:mx-0">
        <CardHeader className="text-center pb-3 px-4 sm:px-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">診断完了！</CardTitle>
          <p className="text-sm sm:text-base text-gray-600">あなたの骨格タイプが判定されました</p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
          {/* 診断結果 */}
          <div className={`p-4 sm:p-6 rounded-2xl border-2 bg-gradient-to-r ${
            frameInfo.color === 'blue' ? 'from-blue-50 to-indigo-50 border-blue-200' :
            frameInfo.color === 'purple' ? 'from-purple-50 to-violet-50 border-purple-200' :
            'from-green-50 to-emerald-50 border-green-200'
          }`}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-2">{frameInfo.icon}</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{frameInfo.name}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{frameInfo.description}</p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 h-12 touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              やり直す
            </Button>
            <Button
              onClick={handleConfirmResult}
              className={`flex-1 h-12 bg-gradient-to-r ${
                frameInfo.color === 'blue' ? 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600' :
                frameInfo.color === 'purple' ? 'from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600' :
                'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              } text-white touch-manipulation`}
            >
              この結果を採用
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQ = questions[currentQuestion]

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl mx-2 sm:mx-0">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-gray-800 text-lg sm:text-xl">骨格診断</CardTitle>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              質問 {getQuestionNumber(currentQuestion)} / 3
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={progress} className="w-full h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
        {/* 質問 */}
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 leading-relaxed">
            {currentQ.question}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 leading-relaxed">
            {currentQ.description}
          </p>
        </div>

        {/* 回答ボタン */}
        <div className="grid gap-3 sm:gap-4">
          <Button
            onClick={() => handleAnswer(true)}
            className="h-14 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm sm:text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
          >
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-center leading-tight">{currentQ.yesDescription}</span>
          </Button>
          <Button
            onClick={() => handleAnswer(false)}
            className="h-14 sm:h-16 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm sm:text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
          >
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-center leading-tight">{currentQ.noDescription}</span>
          </Button>
        </div>

        {/* 戻るボタン */}
        {currentQuestion > 0 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full h-12 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            前の質問に戻る
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
