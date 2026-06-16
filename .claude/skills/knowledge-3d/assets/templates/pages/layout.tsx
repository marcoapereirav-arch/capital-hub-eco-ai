import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Layout de la sección Knowledge.
 *
 * Responsabilidades:
 *  1. Gate de autenticación: si no hay user → /login.
 *  2. Gate de rol: solo el rol admin entra (el Knowledge es el cerebro del
 *     SaaS, no del usuario final). Ajusta el nombre del rol si en tu
 *     proyecto se llama distinto.
 *  3. Renderizar `children` en un contenedor flex con scroll vertical.
 *
 * Si tu proyecto tiene un AppShell propio (sidebar/topbar/etc.), envuelve
 * `children` con él aquí. El template no asume ninguno por defecto para que
 * funcione out-of-the-box en cualquier app Next.js + Supabase.
 */
export default async function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single()

  const isAdmin = (profile as { roles?: { name: string } } | null)?.roles?.name === 'admin'
  if (!isAdmin) redirect('/')

  return <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
}
