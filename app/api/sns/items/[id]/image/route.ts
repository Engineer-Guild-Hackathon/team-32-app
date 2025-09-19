import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // SNS用なので認証は不要（他のユーザーの画像を表示するため）
    console.log(`Fetching SNS image for item ID: ${params.id}`)

    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('image_path')
      .eq('id', params.id)
      .single()

    if (itemError) {
      console.error('Database error:', itemError)
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (!item) {
      console.log(`Item not found for ID: ${params.id}`)
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    console.log(`SNS Image path found: ${item.image_path}`)

    const { data, error } = await supabase.storage
      .from('users')
      .download(item.image_path)

    if (error) {
      console.error('Failed to download image from storage:', error)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Supabaseから取得したBlobオブジェクトには正しいMIMEタイプが含まれている
    // そのタイプを使用してContent-Typeヘッダーを設定
    const headers = new Headers()
    headers.set('Content-Type', data.type || 'image/jpeg') // フォールバックとしてimage/jpegを設定

    console.log(`Successfully fetched SNS image with MIME type: ${data.type}`)
    return new NextResponse(data, {
      status: 200,
      headers: headers,
    })
  } catch (error) {
    console.error('Unexpected error in SNS image endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
