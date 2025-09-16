"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Baby as Body, Stethoscope, User } from "lucide-react"
import { SkeletonDiagnosis } from "./skeleton-diagnosis"

type FrameType = "straight" | "wave" | "natural" | ""

interface FrameTypeSelectorProps {
  value: FrameType
  onChange: (value: FrameType) => void
}

export function FrameTypeSelector({ value, onChange }: FrameTypeSelectorProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "diagnosis">("manual")
  const [showDiagnosis, setShowDiagnosis] = useState(false)

  const frameTypes = [
    {
      id: "straight",
      name: "ストレート",
      description: "肩幅と腰幅がほぼ同じで、ウエストのくびれが少ない体型",
    },
    {
      id: "wave",
      name: "ウェーブ",
      description: "上半身が華奢で、下半身にボリュームがある体型",
    },
    {
      id: "natural",
      name: "ナチュラル",
      description: "骨格がしっかりしていて、筋肉質な印象の体型",
    },
  ]

  const handleFrameTypeChange = (selectedValue: string) => {
    if (value === selectedValue) {
      onChange("")
    } else {
      onChange(selectedValue as FrameType)
    }
  }

  const handleDiagnosisComplete = (frameType: FrameType) => {
    onChange(frameType)
    setShowDiagnosis(false)
    setActiveTab("manual")
  }

  const handleBackFromDiagnosis = () => {
    setShowDiagnosis(false)
    setActiveTab("manual")
  }

  if (showDiagnosis) {
    return (
      <SkeletonDiagnosis
        onComplete={handleDiagnosisComplete}
        onBack={handleBackFromDiagnosis}
      />
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 mx-2 sm:mx-0">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            <Body className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-gray-800 text-lg sm:text-xl">骨格タイプ</CardTitle>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">あなたの体型を設定してください</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "manual" | "diagnosis")}>
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-12">
            <TabsTrigger value="manual" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">設定</span>
              <span className="sm:hidden">設定</span>
            </TabsTrigger>
            <TabsTrigger value="diagnosis" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">診断で判定</span>
              <span className="sm:hidden">診断</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-3 sm:space-y-4">
            <RadioGroup value={value} onValueChange={handleFrameTypeChange}>
              <div className="grid gap-3 sm:gap-4">
                {frameTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`flex items-start space-x-3 sm:space-x-4 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer touch-manipulation ${
                      value === type.id 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
                    }`}
                    onClick={() => handleFrameTypeChange(type.id)}
                  >
                    <RadioGroupItem
                      value={type.id}
                      id={`frame-${type.id}`}
                      className="mt-1 pointer-events-none"
                    />
                    <div className="flex-1 pointer-events-none min-w-0">
                      <Label htmlFor={`frame-${type.id}`} className="text-sm sm:text-base font-semibold text-gray-800">
                        {type.name}
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 leading-relaxed">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="diagnosis" className="space-y-4">
            <div className="text-center py-6 sm:py-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center">
                <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">骨格診断</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed px-2">
                3つの簡単な質問に答えるだけで、あなたの骨格タイプを自動判定します
              </p>
              <Button
                onClick={() => setShowDiagnosis(true)}
                className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-12 touch-manipulation"
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                診断を開始する
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}