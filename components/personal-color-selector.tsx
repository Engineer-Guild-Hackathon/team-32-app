"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Palette, Sparkles } from "lucide-react"
import { AIDiagnosisModal } from "@/components/ai-diagnosis-modal"

type PersonalColor = "spring" | "autumn" | "summer" | "winter" | ""

interface PersonalColorSelectorProps {
  value: PersonalColor
  onChange: (value: PersonalColor) => void
}

export function PersonalColorSelector({ value, onChange }: PersonalColorSelectorProps) {
  const [aiModalOpen, setAiModalOpen] = useState(false)

  const personalColors = [
    {
      id: "spring",
      name: "イエベ スプリング",
      description: "明るく鮮やかな色が似合う、温かみのある肌色",
      colors: ["#FFD700", "#FF6B35", "#32CD32", "#FF1493"],
    },
    {
      id: "autumn",
      name: "イエベ オータム",
      description: "深みのある暖色が似合う、黄みがかった肌色",
      colors: ["#8B4513", "#DAA520", "#228B22", "#B22222"],
    },
    {
      id: "summer",
      name: "ブルベ サマー",
      description: "ソフトで上品な色が似合う、青みがかった肌色",
      colors: ["#E6E6FA", "#87CEEB", "#F0E68C", "#DDA0DD"],
    },
    {
      id: "winter",
      name: "ブルベ ウィンター",
      description: "はっきりとした色が似合う、青みがかった肌色",
      colors: ["#000080", "#DC143C", "#FFFFFF", "#FF1493"],
    },
  ]

  const handlePersonalColorChange = (selectedValue: string) => {
    if (value === selectedValue) {
      onChange("")
    } else {
      onChange(selectedValue as PersonalColor)
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-gray-800 text-xl">パーソナルカラー</CardTitle>
            <p className="text-gray-600 text-sm mt-1">あなたの肌色に最も似合うカラータイプを選択してください</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Button
            onClick={() => setAiModalOpen(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI診断
          </Button>
        </div>
        <RadioGroup value={value} onValueChange={handlePersonalColorChange}>
          <div className="grid gap-4">
            {personalColors.map((color) => (
              <div
                key={color.id}
                className={`flex items-start space-x-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  value === color.id 
                    ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-violet-50 shadow-lg' 
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-md'
                }`}
                onClick={() => handlePersonalColorChange(color.id)}
              >
                <RadioGroupItem
                  value={color.id}
                  id={`color-${color.id}`}
                  className="mt-1 pointer-events-none"
                />
                <div className="flex-1 pointer-events-none">
                  <Label htmlFor={`color-${color.id}`} className="text-base font-semibold text-gray-800">
                    {color.name}
                  </Label>
                  <p className="text-sm text-gray-600 mt-2 mb-4 leading-relaxed">{color.description}</p>
                  <div className="flex space-x-3">
                    {color.colors.map((colorCode, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: colorCode }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>

      <AIDiagnosisModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onDiagnosisComplete={(color) => {
          onChange(color)
          setAiModalOpen(false)
        }}
      />
    </Card>
  )
}