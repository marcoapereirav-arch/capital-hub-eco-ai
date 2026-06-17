'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 8) { setError('La contraseña debe tener mínimo 8 caracteres'); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Error'); return }
    setDone(true)
    setTimeout(() => router.push('/login?reset=ok'), 1500)
  }

  if (!token) return <p className="mx-auto max-w-sm p-6 text-center text-sm" style={{ color: '#9CA3AF' }}>Enlace inválido.</p>
  if (done) return <p className="mx-auto max-w-sm p-6 text-center" style={{ color: '#F5F6F7' }}>Contraseña actualizada. Redirigiendo...</p>

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#0F0F12' }}>
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-4" style={{ color: '#F5F6F7' }}>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Inter Tight', sans-serif" }}>Nueva contraseña</h1>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" minLength={8} required className="rounded-lg px-4 py-3 text-base outline-none" style={{ background: '#2A2D34', color: '#FFFFFF', border: '1px solid #2A2D34' }} />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la contraseña" minLength={8} required className="rounded-lg px-4 py-3 text-base outline-none" style={{ background: '#2A2D34', color: '#FFFFFF', border: '1px solid #2A2D34' }} />
        {error && <p className="text-sm" style={{ color: '#FCA5A5' }}>{error}</p>}
        <button disabled={loading} className="rounded-lg px-4 py-3 font-semibold disabled:opacity-60" style={{ background: '#FFFFFF', color: '#0F0F12' }}>{loading ? 'Guardando...' : 'Guardar contraseña'}</button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetForm /></Suspense>
}
