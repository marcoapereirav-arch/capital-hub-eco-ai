'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function ConfirmInner() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [msg, setMsg] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    if (!token) { setState('error'); setMsg('Enlace inválido.'); return }
    fetch('/api/auth/change-email/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const d = await res.json().catch(() => ({}))
        if (!res.ok) { setState('error'); setMsg(d.error || 'No se pudo confirmar el cambio.') }
        else { setState('ok'); setNewEmail(d.newEmail || '') }
      })
      .catch(() => { setState('error'); setMsg('No se pudo confirmar el cambio.') })
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#0F0F12' }}>
      <div className="w-full max-w-sm text-center" style={{ color: '#F5F6F7' }}>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          Cambio de email
        </h1>
        {state === 'loading' && <p style={{ color: '#9CA3AF' }}>Confirmando…</p>}
        {state === 'ok' && (
          <p style={{ color: '#F5F6F7', lineHeight: 1.6 }}>
            ✓ Tu email se actualizó a <strong style={{ color: '#FFFFFF' }}>{newEmail}</strong>.<br />
            Ya puedes usarlo para iniciar sesión.<br />
            <a href="/login" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>Ir a iniciar sesión</a>
          </p>
        )}
        {state === 'error' && <p style={{ color: '#FCA5A5' }}>{msg}</p>}
      </div>
    </div>
  )
}

export default function ConfirmEmailChangePage() {
  return <Suspense fallback={null}><ConfirmInner /></Suspense>
}
