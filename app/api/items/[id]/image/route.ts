import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
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