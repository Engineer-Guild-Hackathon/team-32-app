"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Sparkles } from "lucide-react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FullBodyImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (file: File) => void
}

export function FullBodyImageModal({ open, onOpenChange, onSave }: FullBodyImageModalProps) {
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null)
  const [generatedImagePreview, setGeneratedImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const faceFileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFaceImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFaceImagePreview(reader.result as string)
        setGeneratedImagePreview(null)
        setGenerationError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateFromFace = async () => {
    if (!faceImagePreview) return;

    setIsGenerating(true)
    setGenerationError(null)

    try {
      const response = await fetch('/api/generate-full-body-from-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faceImage: faceImagePreview }),
      })

      const data = await response.json()

      if (data.success && data.imageUrl) {
        setGeneratedImagePreview(data.imageUrl)
      } else {
        setGenerationError(data.error || '画像の生成に失敗しました')
      }
    } catch (error) {
      console.error('Error generating full body image:', error)
      setGenerationError('画像の生成中にエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveUploaded = async () => {
    if (!uploadedFile) return;

    setIsSaving(true)
    try {
      onSave(uploadedFile)
      resetState()
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveGenerated = async () => {
    if (!generatedImagePreview) return;

    setIsSaving(true)
    try {
      // Convert base64 to blob
      const response = await fetch(generatedImagePreview)
      const blob = await response.blob()
      const file = new File([blob], 'generated-full-body.png', { type: 'image/png' })

      onSave(file)
      resetState()
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const resetState = () => {
    setUploadedImagePreview(null)
    setUploadedFile(null)
    setFaceImagePreview(null)
    setGeneratedImagePreview(null)
    setGenerationError(null)
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>全身写真を登録</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">写真をアップロード</TabsTrigger>
            <TabsTrigger value="generate">顔写真から生成</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-64 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
                {uploadedImagePreview ? (
                  <Image
                    src={uploadedImagePreview}
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  写真を選択
                </Button>
                {uploadedFile && (
                  <Button
                    type="button"
                    onClick={handleSaveUploaded}
                    disabled={isSaving}
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="mt-6">
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  顔写真をアップロードして、AIで全身画像を生成します
                </p>
                <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
                  {faceImagePreview ? (
                    <Image
                      src={faceImagePreview}
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
                  ref={faceFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFaceImageSelect}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => faceFileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    顔写真を選択
                  </Button>
                  {faceImagePreview && (
                    <Button
                      type="button"
                      onClick={handleGenerateFromFace}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGenerating ? '生成中...' : 'この写真から生成'}
                    </Button>
                  )}
                </div>
              </div>

              {generationError && (
                <div className="text-center text-sm text-destructive">
                  {generationError}
                </div>
              )}

              {generatedImagePreview && (
                <div className="space-y-4">
                  <div className="text-center text-sm font-medium">生成された全身画像</div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-48 h-64 rounded-lg overflow-hidden border-2 border-solid border-primary">
                      <Image
                        src={generatedImagePreview}
                        alt="Generated full body"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleSaveGenerated}
                      disabled={isSaving}
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}