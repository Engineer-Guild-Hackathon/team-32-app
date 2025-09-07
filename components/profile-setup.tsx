"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { User, Palette, Baby as Body, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type BodyType = "straight" | "wave" | "natural" | ""
type PersonalColor = "spring" | "autumn" | "summer" | "winter" | ""

interface ProfileData {
  bodyType: BodyType
  personalColor: PersonalColor
}

export function ProfileSetup() {
  const [currentStep, setCurrentStep] = useState(1)
  const [profileData, setProfileData] = useState<ProfileData>({
    bodyType: "",
    personalColor: "",
  })
  const [isCompleted, setIsCompleted] = useState(false)

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

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    console.log("Profile setup completed:", profileData)
    setIsCompleted(true)
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return profileData.bodyType !== ""
      case 2:
        return profileData.personalColor !== ""
      default:
        return false
    }
  }

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">プロフィール設定完了！</CardTitle>
            <CardDescription>
              骨格タイプ:{" "}
              <span className="font-medium">{bodyTypes.find((t) => t.id === profileData.bodyType)?.name}</span>
              <br />
              パーソナルカラー:{" "}
              <span className="font-medium">
                {personalColors.find((c) => c.id === profileData.personalColor)?.name}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">これで準備完了です。次は服を登録して着せ替えを楽しみましょう！</p>
            <Link href="/styling">
              <Button size="lg" className="gap-2">
                スタイリングを始める
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {step}
            </div>
            {step < 2 && (
              <div
                className={cn("w-16 h-0.5 mx-2 transition-colors", currentStep > step ? "bg-primary" : "bg-muted")}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Body Type */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Body className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">骨格診断</CardTitle>
            <CardDescription>あなたの骨格タイプを選択してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={profileData.bodyType}
              onValueChange={(value) => setProfileData((prev) => ({ ...prev, bodyType: value as BodyType }))}
            >
              {bodyTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={type.id} className="text-base font-medium cursor-pointer">
                      {type.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Personal Color */}
      {currentStep === 2 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">パーソナルカラー診断</CardTitle>
            <CardDescription>あなたに似合うカラータイプを選択してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={profileData.personalColor}
              onValueChange={(value) => setProfileData((prev) => ({ ...prev, personalColor: value as PersonalColor }))}
            >
              {personalColors.map((color) => (
                <div
                  key={color.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <RadioGroupItem value={color.id} id={color.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={color.id} className="text-base font-medium cursor-pointer">
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
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
          戻る
        </Button>

        {currentStep < 2 ? (
          <Button onClick={handleNext} disabled={!isStepComplete(currentStep)}>
            次へ
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={!isStepComplete(currentStep)}>
            完了
          </Button>
        )}
      </div>
    </div>
  )
}
