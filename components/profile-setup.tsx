"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Palette, Baby as Body } from "lucide-react"

type BodyType = "straight" | "wave" | "natural" | ""
type PersonalColor = "spring" | "autumn" | "summer" | "winter" | ""

interface ProfileData {
  bodyType: BodyType
  personalColor: PersonalColor
}

export function ProfileSetup() {
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData>({
    bodyType: "",
    personalColor: "",
  })

  const bodyTypes = [
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

  const handleComplete = () => {
    console.log("Profile setup completed:", profileData)
    router.push("/")
  }

  const handleBodyTypeChange = (value: string) => {
    if (profileData.bodyType === value) {
      setProfileData((prev) => ({ ...prev, bodyType: "" }))
    } else {
      setProfileData((prev) => ({ ...prev, bodyType: value as BodyType }))
    }
  }

  const handlePersonalColorChange = (value: string) => {
    if (profileData.personalColor === value) {
      setProfileData((prev) => ({ ...prev, personalColor: "" }))
    } else {
      setProfileData((prev) => ({ ...prev, personalColor: value as PersonalColor }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Body Type Section */}
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
          <RadioGroup value={profileData.bodyType} onValueChange={handleBodyTypeChange}>
            <div className="grid gap-3">
              {bodyTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleBodyTypeChange(type.id)}
                >
                  <RadioGroupItem
                    value={type.id}
                    id={`body-${type.id}`}
                    className="mt-1 pointer-events-none"
                  />
                  <div className="flex-1 pointer-events-none">
                    <Label htmlFor={`body-${type.id}`} className="text-base font-medium">
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

      {/* Personal Color Section */}
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
          <RadioGroup value={profileData.personalColor} onValueChange={handlePersonalColorChange}>
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

      {/* Complete button */}
      <div className="flex justify-end">
        <Button onClick={handleComplete} size="lg" className="min-w-[200px]">
          保存
        </Button>
      </div>
    </div>
  )
}
