import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: item } = await supabase
    .from('items')
    .select('image_path')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const { data, error } = await supabase.storage
    .from('users')
    .download(item.image_path)

  if (error) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  return new NextResponse(data, {
    headers: {
      'Content-Type': 'image/*',
    },
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // アイテムの情報を取得
  const { data: item } = await supabase
    .from('items')
    .select('image_path')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // ストレージから画像を削除
  if (item.image_path) {
    const { error: storageError } = await supabase.storage
      .from('users')
      .remove([item.image_path])

    if (storageError) {
      console.error('Failed to delete image from storage:', storageError)
    }
  }

  // データベースからアイテムを削除
  const { error: dbError } = await supabase
    .from('items')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (dbError) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}