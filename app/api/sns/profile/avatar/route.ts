import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const path = `${user.id}/avatar/${Date.now()}`

  const { error: upErr } = await supabase.storage
    .from('users')
    .upload(path, buffer, { contentType: file.type })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  // profiles に列がない環境もあるため、auth の user_metadata に保存
  const { error: metaErr } = await supabase.auth.updateUser({
    data: { avatar_path: path },
  })

  if (metaErr) return NextResponse.json({ error: metaErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

