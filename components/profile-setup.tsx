"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FullBodyImageModal } from "@/components/full-body-image-modal"
import { FrameTypeSelector } from "@/components/frame-type-selector"
import { PersonalColorSelector } from "@/components/personal-color-selector"
import { Camera, Upload } from "lucide-react"
import Image from "next/image"

type FrameType = "straight" | "wave" | "natural" | ""
type PersonalColor = "spring" | "autumn" | "summer" | "winter" | ""

interface ProfileData {
  frameType: FrameType
  personalColor: PersonalColor
}

export function ProfileSetup() {
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
    setProfileData((prev) => ({ ...prev, personalColor: value }))
    await saveProfileData({ personalColor: value })
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>全身写真</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-48 h-64 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
              {currentImageUrl ? (
                <Image
                  src={currentImageUrl}
                  alt="Full body preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(true)}
              className="gap-2"
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
