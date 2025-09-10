"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FaceImageUpload } from "@/components/face-image-upload"
import { FrameTypeSelector } from "@/components/frame-type-selector"
import { PersonalColorSelector } from "@/components/personal-color-selector"

type FrameType = "straight" | "wave" | "natural" | ""
type PersonalColor = "spring" | "autumn" | "summer" | "winter" | ""

interface ProfileData {
  frameType: FrameType
  personalColor: PersonalColor
}

export function ProfileSetup() {
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData>({
    frameType: "",
    personalColor: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null)

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

        // Try to load existing face image
        const imageResponse = await fetch('/api/face-image')
        if (imageResponse.ok && isMounted) {
          const imageBlob = await imageResponse.blob()
          imageUrl = URL.createObjectURL(imageBlob)
          console.log('Face image loaded:', imageUrl)
          setInitialImageUrl(imageUrl)
        } else if (!imageResponse.ok) {
          console.log('No face image found (404 expected):', imageResponse.status)
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

  const handleComplete = async () => {
    setIsSaving(true)
    try {

      // Upload image if selected
      if (selectedImage) {
        const formData = new FormData()
        formData.append('file', selectedImage)
        
        const uploadResponse = await fetch('/api/upload-face', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          console.error('Failed to upload image')
          alert('画像のアップロードに失敗しました')
          setIsSaving(false)
          return
        }
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_color: profileData.personalColor || null,
          frame_type: profileData.frameType || null,
        }),
      })
      
      if (response.ok) {
        console.log("Profile saved successfully")
        router.push("/")
      } else {
        const error = await response.json()
        console.error('Failed to save profile:', error)
        alert('プロフィールの保存に失敗しました')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('プロフィールの保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFrameTypeChange = (value: FrameType) => {
    setProfileData((prev) => ({ ...prev, frameType: value }))
  }

  const handlePersonalColorChange = (value: PersonalColor) => {
    setProfileData((prev) => ({ ...prev, personalColor: value }))
  }

  const handleImageSelect = (file: File | null) => {
    setSelectedImage(file)
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
      <FaceImageUpload 
        onImageSelect={handleImageSelect}
        selectedImage={selectedImage}
        initialImageUrl={initialImageUrl}
      />

      <FrameTypeSelector
        value={profileData.frameType}
        onChange={handleFrameTypeChange}
      />

      <PersonalColorSelector
        value={profileData.personalColor}
        onChange={handlePersonalColorChange}
      />

      <div className="flex justify-end">
        <Button 
          onClick={handleComplete} 
          size="lg" 
          className="min-w-[200px]"
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
