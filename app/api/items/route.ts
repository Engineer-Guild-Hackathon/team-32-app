import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const category = formData.get('category') as string

  if (!file || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const timestamp = Date.now()
  const fileName = `${user.id}/item_images/${timestamp}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const clipEndpoint = process.env.CLIP_API_ENDPOINT

  if (!clipEndpoint) {
    return NextResponse.json({ error: 'CLIP API endpoint is not configured' }, { status: 500 })
  }

  const imageBase64 = buffer.toString('base64')

  let embedding: number[]
  try {
    const clipResponse = await fetch(`${clipEndpoint}/vectorize-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_base64: imageBase64 }),
    })

    if (!clipResponse.ok) {
      return NextResponse.json({ error: 'Failed to retrieve image embedding' }, { status: 502 })
    }

    const clipPayload = (await clipResponse.json()) as { vector?: unknown }

    if (!Array.isArray(clipPayload.vector)) {
      return NextResponse.json({ error: 'Invalid embedding response from CLIP API' }, { status: 502 })
    }

    if (!clipPayload.vector.every((value) => typeof value === 'number')) {
      return NextResponse.json({ error: 'Embedding vector must contain only numbers' }, { status: 502 })
    }

    if (clipPayload.vector.length !== 512) {
      return NextResponse.json({ error: 'Embedding vector must have 512 dimensions' }, { status: 502 })
    }

    embedding = clipPayload.vector as number[]
  } catch (error) {
    console.error('Error while requesting CLIP embedding:', error)
    return NextResponse.json({ error: 'Unable to compute image embedding' }, { status: 502 })
  }

  const { error: uploadError } = await supabase.storage
    .from('users')
    .upload(fileName, buffer, {
      contentType: file.type,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: itemData, error: itemError } = await supabase
    .from('items')
    .insert({
      user_id: user.id,
      category: category as Database['public']['Enums']['item_category'],
      image_path: fileName,
      embedding,
    })
    .select()
    .single()

  if (itemError) {
    await supabase.storage.from('users').remove([fileName])
    return NextResponse.json({ error: itemError.message }, { status: 500 })
  }

  return NextResponse.json({ item: itemData })
}
