import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request)
  
  const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev'
  const isRegisterPage = request.nextUrl.pathname === '/register'
  const isAuthPage = request.nextUrl.pathname === '/login' || isRegisterPage

  // 開発環境以外で/registerにアクセスした場合は/loginにリダイレクト
  if (!isDevelopment && isRegisterPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|api/sns/images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}