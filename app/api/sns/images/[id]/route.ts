import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    
    console.log(`Fetching SNS image for item ID: ${params.id}`)

    // アイテム情報を取得
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

    // ストレージから画像を取得
    console.log(`Attempting to download image from storage: ${item.image_path}`)
    
    const { data, error } = await supabase.storage
      .from('users')
      .download(item.image_path)

    console.log('Storage download result:', { data: !!data, error })

    if (error) {
      console.error('Failed to download image from storage:', error)
      return NextResponse.json({ error: 'Image not found', details: error }, { status: 404 })
    }

    // 画像を返す
    const headers = new Headers()
    headers.set('Content-Type', data.type || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=3600') // 1時間キャッシュ

    console.log(`Successfully fetched SNS image with MIME type: ${data.type}`)
    return new NextResponse(data, {
      status: 200,
      headers: headers,
    })
  } catch (error) {
    console.error('Unexpected error in SNS image endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}
