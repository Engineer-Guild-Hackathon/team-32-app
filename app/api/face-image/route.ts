import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fileName = `${user.id}/face`

  // Download from Supabase Storage
  const { data, error } = await supabase.storage
    .from('images')
    .download(fileName)

  if (error) {
    return NextResponse.json({ error: 'No face image found' }, { status: 404 })
  }

  // Convert blob to response with proper headers
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'image/*',
    },
  })
}