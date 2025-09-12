import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the full body image path from the database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_body_image_path')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.full_body_image_path) {
    return NextResponse.json({ error: 'No full body image found' }, { status: 404 })
  }

  // Download from Supabase Storage using the path from database
  const { data, error } = await supabase.storage
    .from('users')
    .download(profile.full_body_image_path)

  if (error) {
    return NextResponse.json({ error: 'No full body image found' }, { status: 404 })
  }

  // Convert blob to response with proper headers
  // Supabaseから取得したBlobオブジェクトには正しいMIMEタイプが含まれている
  const headers = new Headers()
  headers.set('Content-Type', data.type || 'image/jpeg') // フォールバックとしてimage/jpegを設定

  console.log(`Successfully fetched full body image with MIME type: ${data.type}`)
  return new NextResponse(data, {
    headers: headers,
  })
}