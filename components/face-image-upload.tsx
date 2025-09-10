"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, Upload } from "lucide-react"
import Image from "next/image"

interface FaceImageUploadProps {
  onImageSelect: (file: File | null) => void
  selectedImage: File | null
  initialImageUrl?: string | null
}

export function FaceImageUpload({ onImageSelect, selectedImage, initialImageUrl }: FaceImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialImageUrl && !selectedImage) {
      setImagePreview(initialImageUrl)
    } else if (!initialImageUrl && !selectedImage) {
      setImagePreview(null)
    }
  }, [initialImageUrl, selectedImage])

  useEffect(() => {
    // Cleanup function to revoke object URLs
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Revoke previous blob URL if it exists
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }

      onImageSelect(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>顔写真</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/25">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Face preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            写真を選択
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}