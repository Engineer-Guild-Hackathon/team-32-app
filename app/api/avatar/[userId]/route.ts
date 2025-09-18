import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  try {
    const supabase = await createClient()

    // profiles テーブルに avatar_path がある前提
    // profiles の列がない環境向け: auth の user_metadata から読む
    let avatarPath: string | null = null
    try {
      const service = createServiceClient()
      const { data: userRes } = await (service as any).auth.admin.getUserById(params.userId)
      const u = (userRes as any)?.user
      avatarPath = u?.user_metadata?.avatar_path ?? null
    } catch {}

    if (!avatarPath) {
      // profiles パターン（存在する場合のみ）
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('avatar_path')
        .eq('id', params.userId)
        .maybeSingle()
      if (!error) avatarPath = profile?.avatar_path ?? null
    }

    if (!avatarPath) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const service = createServiceClient()
    const { data, error: dlError } = await service.storage
      .from('users')
      .download(avatarPath)

    if (dlError || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', data.type || 'image/jpeg')
    return new NextResponse(data, { status: 200, headers })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

