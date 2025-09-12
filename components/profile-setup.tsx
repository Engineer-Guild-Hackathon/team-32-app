"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FullBodyImageModal } from "@/components/full-body-image-modal"
import { FrameTypeSelector } from "@/components/frame-type-selector"
import { PersonalColorSelector } from "@/components/personal-color-selector"
import { Camera, Upload } from "lucide-react"
import Image from "next/image"
import { useBackground } from "@/components/mobile-background-provider"

type FrameType = "straight" | "wave" | "natural" | ""
type PersonalColor = "spring" | "autumn" | "summer" | "winter" | ""

interface ProfileData {
  frameType: FrameType
  personalColor: PersonalColor
}

export function ProfileSetup() {
  const { refreshBackground } = useBackground()
  const [profileData, setProfileData] = useState<ProfileData>({
    frameType: "",
    personalColor: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    let imageUrl: string | null = null

    // Load existing profile data
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.ok && isMounted) {
          const data = await response.json()
          setProfileData({
            frameType: data.frame_type || "",
            personalColor: data.personal_color || "",
          })
        }

        // Try to load existing full body image
        const imageResponse = await fetch('/api/full-body-image')
        if (imageResponse.ok && isMounted) {
          const imageBlob = await imageResponse.blob()
          imageUrl = URL.createObjectURL(imageBlob)
          console.log('Full body image loaded:', imageUrl)
          setCurrentImageUrl(imageUrl)
        } else if (!imageResponse.ok) {
          console.log('No full body image found (404 expected):', imageResponse.status)
        }
      } catch (error) {
        // Silently handle errors - image might not exist
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    loadProfile()

    // Cleanup function
    return () => {
      isMounted = false
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [])

  const handleImageSave = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await fetch('/api/upload-full-body', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        console.error('Failed to upload image')
        alert('画像のアップロードに失敗しました')
        return
      }

      // Reload the image
      const imageResponse = await fetch('/api/full-body-image')
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob()
        const imageUrl = URL.createObjectURL(imageBlob)
        setCurrentImageUrl(imageUrl)
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('画像のアップロードに失敗しました')
    }
  }

  const saveProfileData = async (data: Partial<ProfileData>) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_color: data.personalColor !== undefined ? data.personalColor || null : profileData.personalColor || null,
          frame_type: data.frameType !== undefined ? data.frameType || null : profileData.frameType || null,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to save profile:', error)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  const handleFrameTypeChange = async (value: FrameType) => {
    setProfileData((prev) => ({ ...prev, frameType: value }))
    await saveProfileData({ frameType: value })
  }

  const handlePersonalColorChange = async (value: PersonalColor) => {
    console.log('パーソナルカラー変更:', value)
    setProfileData((prev) => ({ ...prev, personalColor: value }))
    await saveProfileData({ personalColor: value })
    console.log('プロフィール保存完了')
    // パーソナルカラー変更後に背景をリフレッシュ
    setTimeout(() => {
      console.log('背景リフレッシュ開始')
      refreshBackground()
    }, 500)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center items-center h-64">
        <div className="text-lg text-muted-foreground">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-800 text-xl">全身写真</CardTitle>
              <p className="text-gray-600 text-sm mt-1">あなたの全身を写した写真をアップロードしてください</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-56 h-72 rounded-2xl overflow-hidden border-4 border-dashed border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
              {currentImageUrl ? (
                <Image
                  src={currentImageUrl}
                  alt="Full body preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">写真をアップロード</p>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Upload className="w-4 h-4" />
              {currentImageUrl ? '写真を変更' : '写真を登録'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <FrameTypeSelector
        value={profileData.frameType}
        onChange={handleFrameTypeChange}
      />

      <PersonalColorSelector
        value={profileData.personalColor}
        onChange={handlePersonalColorChange}
      />

      <FullBodyImageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleImageSave}
      />
    </div>
  )
}
