"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Baby as Body } from "lucide-react"

type FrameType = "straight" | "wave" | "natural" | ""

interface FrameTypeSelectorProps {
  value: FrameType
  onChange: (value: FrameType) => void
}

export function FrameTypeSelector({ value, onChange }: FrameTypeSelectorProps) {
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

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            <Body className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-gray-800 text-xl">骨格タイプ</CardTitle>
            <p className="text-gray-600 text-sm mt-1">あなたの体型に最も近いタイプを選択してください</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={handleFrameTypeChange}>
          <div className="grid gap-4">
            {frameTypes.map((type) => (
              <div
                key={type.id}
                className={`flex items-start space-x-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
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
                <div className="flex-1 pointer-events-none">
                  <Label htmlFor={`frame-${type.id}`} className="text-base font-semibold text-gray-800">
                    {type.name}
                  </Label>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}