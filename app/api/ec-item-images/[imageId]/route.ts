import { NextResponse } from 'next/server'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { createServiceClient } from '@/lib/supabase/server'

const IMAGE_BUCKET = 'ec_item_images'
const DATASET_DIR = path.join(process.cwd(), 'clip', 'dataset', 'images')

const mimeTypeByExtension: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function resolveContentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase()
  return mimeTypeByExtension[ext] ?? 'image/jpeg'
}

export async function GET(
  _request: Request,
  { params }: { params: { imageId: string } }
) {
  const imageId = params.imageId

  if (!imageId) {
    return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
  }

  const safeImageId = path.basename(imageId)
  const supabase = createServiceClient()

  try {
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .download(safeImageId)

    if (!error && data) {
      const buffer = Buffer.from(await data.arrayBuffer())
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': data.type || resolveContentType(safeImageId),
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    if (error) {
      console.warn('Failed to download image from storage:', safeImageId, error)
    }
  } catch (error) {
    console.warn('Unexpected error while downloading image:', safeImageId, error)
  }

  try {
    const filePath = path.join(DATASET_DIR, safeImageId)
    const file = await fs.readFile(filePath)

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': resolveContentType(safeImageId),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Image not found in local dataset:', safeImageId, error)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}
