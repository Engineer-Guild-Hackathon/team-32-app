import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the face image path from the database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('face_image_path')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.face_image_path) {
    return NextResponse.json({ error: 'No face image found' }, { status: 404 })
  }

  // Download from Supabase Storage using the path from database
  const { data, error } = await supabase.storage
    .from('users')
    .download(profile.face_image_path)

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