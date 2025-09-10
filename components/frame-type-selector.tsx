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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Body className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>骨格タイプ</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={handleFrameTypeChange}>
          <div className="grid gap-3">
            {frameTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleFrameTypeChange(type.id)}
              >
                <RadioGroupItem
                  value={type.id}
                  id={`frame-${type.id}`}
                  className="mt-1 pointer-events-none"
                />
                <div className="flex-1 pointer-events-none">
                  <Label htmlFor={`frame-${type.id}`} className="text-base font-medium">
                    {type.name}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}