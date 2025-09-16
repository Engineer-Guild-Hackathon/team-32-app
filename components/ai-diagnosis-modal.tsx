"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Camera, Upload, Sparkles, Loader2 } from "lucide-react"
import Image from "next/image"

type PersonalColor = "spring" | "autumn" | "summer" | "winter"

interface AIDiagnosisModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDiagnosisComplete: (color: PersonalColor) => void
}

interface DiagnosisResult {
  class: string
  confidence: number
}

const colorDisplayNames: Record<PersonalColor, string> = {
  "spring": "イエベ スプリング",
  "autumn": "イエベ オータム",
  "summer": "ブルベ サマー",
  "winter": "ブルベ ウィンター"
}

const colorGradients: Record<PersonalColor, string> = {
  "spring": "from-yellow-400 to-orange-400",
  "autumn": "from-orange-600 to-red-600",
  "summer": "from-blue-400 to-purple-400",
  "winter": "from-blue-600 to-indigo-600"
}

export function AIDiagnosisModal({ open, onOpenChange, onDiagnosisComplete }: AIDiagnosisModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<DiagnosisResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setError(null)
      setResults(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDiagnosis = async () => {
    if (!imageFile) {
      setError("画像を選択してください")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Convert image to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1]
          resolve(base64String)
        }
      })
      reader.readAsDataURL(imageFile)
      const base64Image = await base64Promise

      // Call server-side API
      const response = await fetch('/api/ai-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '診断に失敗しました')
      }

      const data = await response.json()

      if (data && data.results) {
        setResults(data.results)
      } else {
        throw new Error('診断結果の取得に失敗しました')
      }
    } catch (err: any) {
      console.error('Diagnosis error:', err)
      setError(err.message || '診断中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRegisterResult = () => {
    if (results && results.length > 0) {
      const topResult = results[0]
      onDiagnosisComplete(topResult.class as PersonalColor)
      handleClose()
    }
  }

  const handleClose = () => {
    setImageFile(null)
    setImagePreview(null)
    setResults(null)
    setError(null)
    onOpenChange(false)
  }

  const getMaxValue = () => {
    if (!results || results.length === 0) return 1
    return Math.max(...results.map(r => r.confidence))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI パーソナルカラー診断
          </DialogTitle>
          <DialogDescription>
            顔写真をアップロードして、AIがあなたのパーソナルカラーを診断します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload Area */}
          {!results && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="face-photo-upload"
                />
                <label
                  htmlFor="face-photo-upload"
                  className="block cursor-pointer"
                >
                  <Card className="p-8 border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors">
                    {imagePreview ? (
                      <div className="relative w-full h-64">
                        <Image
                          src={imagePreview}
                          alt="Face preview"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-violet-400 rounded-full flex items-center justify-center">
                          <Camera className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-medium text-gray-700">顔写真をアップロード</p>
                          <p className="text-sm text-gray-500 mt-1">クリックまたはドラッグ＆ドロップ</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </label>
              </div>

              {imagePreview && (
                <Button
                  onClick={() => document.getElementById('face-photo-upload')?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  別の写真を選択
                </Button>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleDiagnosis}
                disabled={!imageFile || isAnalyzing}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    診断中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    診断開始
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">診断結果</h3>
                <div className={`mt-3 inline-block px-6 py-3 rounded-full bg-gradient-to-r ${colorGradients[results[0].class as PersonalColor]} text-white font-bold text-lg shadow-lg`}>
                  {colorDisplayNames[results[0].class as PersonalColor]}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.class} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {colorDisplayNames[result.class as PersonalColor]}
                      </span>
                      <span className="text-gray-600">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full bg-gradient-to-r ${colorGradients[result.class as PersonalColor]} transition-all duration-500`}
                        style={{
                          width: `${(result.confidence / getMaxValue()) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleRegisterResult}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                >
                  結果を登録
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}