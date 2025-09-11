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
      image_path: fileName
    })
    .select()
    .single()

  if (itemError) {
    await supabase.storage.from('users').remove([fileName])
    return NextResponse.json({ error: itemError.message }, { status: 500 })
  }

  return NextResponse.json({ item: itemData })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('id')

  if (!itemId) {
    return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
  }

  const { data: item } = await supabase
    .from('items')
    .select('image_path')
    .eq('id', itemId)
    .eq('user_id', user.id)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  await supabase.storage.from('users').remove([item.image_path])

  return NextResponse.json({ success: true })
}