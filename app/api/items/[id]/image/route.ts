import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // SNS用なので認証は不要
    console.log(`Fetching image for item ID: ${params.id} (SNS access)`)

    console.log(`Querying database for item ID: ${params.id}`)
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('image_path')
      .eq('id', params.id)
      .single()

    console.log('Database query result:', { item, itemError })

    if (itemError) {
      console.error('Database error:', itemError)
      return NextResponse.json({ error: 'Item not found', details: itemError }, { status: 404 })
    }

    if (!item) {
      console.log(`Item not found for ID: ${params.id}`)
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    console.log(`Image path found: ${item.image_path}`)

  console.log(`Attempting to download image from storage: ${item.image_path}`)
  
  const { data, error } = await supabase.storage
    .from('users')
    .download(item.image_path)

  console.log('Storage download result:', { data: !!data, error })

  if (error) {
    console.error('Failed to download image from storage:', error)
    return NextResponse.json({ error: 'Image not found', details: error }, { status: 404 })
  }

    // Supabaseから取得したBlobオブジェクトには正しいMIMEタイプが含まれている
    // そのタイプを使用してContent-Typeヘッダーを設定
    const headers = new Headers()
    headers.set('Content-Type', data.type || 'image/jpeg') // フォールバックとしてimage/jpegを設定

    console.log(`Successfully fetched image with MIME type: ${data.type}`)
    return new NextResponse(data, {
      status: 200,
      headers: headers,
    })
  } catch (error) {
    console.error('Unexpected error in image endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
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