"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Palette } from "lucide-react"

type PersonalColor = "spring" | "autumn" | "summer" | "winter" | ""

interface PersonalColorSelectorProps {
  value: PersonalColor
  onChange: (value: PersonalColor) => void
}

export function PersonalColorSelector({ value, onChange }: PersonalColorSelectorProps) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>パーソナルカラー</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={handlePersonalColorChange}>
          <div className="grid gap-3">
            {personalColors.map((color) => (
              <div
                key={color.id}
                className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handlePersonalColorChange(color.id)}
              >
                <RadioGroupItem
                  value={color.id}
                  id={`color-${color.id}`}
                  className="mt-1 pointer-events-none"
                />
                <div className="flex-1 pointer-events-none">
                  <Label htmlFor={`color-${color.id}`} className="text-base font-medium">
                    {color.name}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">{color.description}</p>
                  <div className="flex space-x-2">
                    {color.colors.map((colorCode, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border border-border"
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
    </Card>
  )
}