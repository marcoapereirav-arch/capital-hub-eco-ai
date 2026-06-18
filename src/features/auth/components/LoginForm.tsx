'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/actions/auth'

export function LoginForm() {
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')
  const [error, setError] = useState<string | null>(
    oauthError === 'auth_callback_failed' ? 'Error al iniciar sesión. Intenta de nuevo.' : null
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Si OK, la server action hace redirect → no toco loading (queda en true hasta nav)
  }

  return (
    <div className="space-y-6 relative">
      {/* Overlay de loading mientras procesa el login. Cubre todo el form para que el usuario
          sepa que está cargando aunque el redirect tarde. */}
      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-md backdrop-blur-[2px]"
          style={{ background: 'rgba(15,15,18,0.6)' }}
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#F5F6F7' }} />
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: '#F5F6F7' }}>
              Iniciando sesión…
            </span>
          </div>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" disabled={loading} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Password
          </label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" disabled={loading} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </span>
          ) : (
            'Sign In'
          )}
        </Button>

        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Forgot password?
          </Link>
        </p>
      </form>
    </div>
  )
}
