'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePassword } from '@/actions/auth'

/**
 * Form para fijar contraseña nueva tras click en email de reset.
 * Pide la contraseña 2 veces y valida que coincidan antes de submit.
 * Tras éxito muestra confirmación visual y redirige a /login en 3s.
 */
export function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las dos contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.set('password', password)
    const result = await updatePassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Éxito → confirmación + redirige a login
    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      window.location.href = '/login?reset=ok'
    }, 2500)
  }

  if (success) {
    return (
      <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 p-5 text-center space-y-3">
        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
        <p className="text-sm font-medium">Contraseña actualizada</p>
        <p className="text-xs text-muted-foreground">
          Ya puedes entrar al OS con tu nueva contraseña. Te llevamos al login…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Nueva contraseña
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Repite la contraseña
        </label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Tiene que ser idéntica"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading || !password || !confirm} className="w-full">
        {loading ? 'Guardando…' : 'Guardar contraseña'}
      </Button>
    </form>
  )
}
