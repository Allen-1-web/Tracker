import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'
import { SUPABASE_AUTH_REQUEST_TIMEOUT_MS, withTimeout } from './with-timeout'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/habits',
  '/goals',
  '/nutrition',
  '/stats',
  '/settings',
  '/onboarding',
  '/admin',
]

const AUTH_ROUTES = ['/login', '/register']

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const { data } = await withTimeout(
      supabase.auth.getUser(),
      SUPABASE_AUTH_REQUEST_TIMEOUT_MS,
      'Превышено время ожидания проверки сессии.',
    )
    user = data.user
  } catch {
    // Supabase недоступен — не блокируем загрузку страницы; защищённые маршруты проверит клиент.
    user = null
  }

  const { pathname } = request.nextUrl

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAdminPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.searchParams.delete('next')
      return NextResponse.redirect(url)
    }
  }

  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
