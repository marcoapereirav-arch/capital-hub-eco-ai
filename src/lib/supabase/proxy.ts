import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessRoute, getEffectiveRole, VIEW_AS_COOKIE_NAME } from '@/lib/auth/role-access'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isProtectedRoute = pathname.startsWith('/dashboard') ||
                           pathname.startsWith('/tasks') ||
                           pathname.startsWith('/integrations')
  const isAuthRoute = pathname.startsWith('/login') ||
                      pathname.startsWith('/callback')

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Gate por rol — solo aplica a rutas del OS autenticadas (descarta /api/, /login, etc)
  // Solo si tenemos user y estamos en una ruta "page" del OS (no public/api/static)
  if (user && !pathname.startsWith('/api/') && !pathname.startsWith('/auth/') && !isAuthRoute) {
    // Lee el rol del profile (cookie cache en futuro si pesa; por ahora 1 query)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const realRole = profile?.role ?? null
    // Si admin está impersonando un rol, el gate de UI usa ese rol efectivo.
    const viewAs = request.cookies.get(VIEW_AS_COOKIE_NAME)?.value ?? null
    const effectiveRole = getEffectiveRole(realRole, viewAs)

    if (!canAccessRoute(effectiveRole, pathname)) {
      // Redirige a /dashboard (siempre permitido salvo bug de config)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}
