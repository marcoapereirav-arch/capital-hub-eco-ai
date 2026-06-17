'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ConfirmEmail() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setState('error'); setError('Enlace inválido.'); return }
    void (async () => {
      const res = await fetch('/api/auth/email-confirmation/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setState('error'); setError(data.error || 'No se pudo confirmar.'); return }
      setState('ok')
      setTimeout(() => router.push('/login?confirmed=ok'), 1500)
    })()
  }, [token, router])

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#0F0F12', color: '#F5F6F7' }}>
      <div className="text-center" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
        {state === 'loading' && <p className="text-base">Confirmando tu cuenta...</p>}
        {state === 'ok' && <p className="text-base">Cuenta confirmada. Redirigiendo...</p>}
        {state === 'error' && <p className="text-base" style={{ color: '#FCA5A5' }}>{error}</p>}
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return <Suspense fallback={null}><ConfirmEmail /></Suspense>
}
