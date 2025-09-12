"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Star,
  AlertCircle,
  Lightbulb
} from "lucide-react"
import { evaluateOutfitWithGemini, type OutfitEvaluation, type OutfitEvaluationResponse } from '@/lib/gemini'

interface OutfitEvaluationGeminiProps {
  imageData: string
  tpo?: string
  onEvaluationComplete?: (result: OutfitEvaluationResponse) => void
}


export function OutfitEvaluationGemini({ 
  imageData, 
  tpo, 
  onEvaluationComplete 
}: OutfitEvaluationGeminiProps) {
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<OutfitEvaluationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEvaluate = async () => {
    setIsEvaluating(true)
    setError(null)
    setEvaluationResult(null)

    try {
      const result = await evaluateOutfitWithGemini(imageData, tpo)
      setEvaluationResult(result)
      onEvaluationComplete?.(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '評価中にエラーが発生しました')
    } finally {
      setIsEvaluating(false)
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AIファッション評価</h3>
        <Button 
          onClick={handleEvaluate}
          disabled={isEvaluating || !imageData}
          className="flex items-center gap-2"
        >
          <Star className="w-4 h-4" />
          {isEvaluating ? '評価中...' : '評価開始'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isEvaluating && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-sm text-gray-600">AIがコーディネートを分析中...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {evaluationResult?.success && evaluationResult.evaluation && (
        <div className="space-y-4">
          {/* 良かった点 */}
          {evaluationResult.evaluation.goodPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-600" />
                  良かった点
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluationResult.evaluation.goodPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 改善点 */}
          {evaluationResult.evaluation.improvements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  改善点
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluationResult.evaluation.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* アドバイス */}
          {evaluationResult.evaluation.recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  アドバイス
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {evaluationResult.evaluation.recommendation}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* テキスト形式の評価結果 */}
      {evaluationResult?.success && evaluationResult.isTextFormat && evaluationResult.evaluationText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI評価結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {evaluationResult.evaluationText}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
