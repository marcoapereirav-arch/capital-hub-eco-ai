'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/actions/auth'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await resetPassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-sm border border-border bg-muted/40 p-4 text-center text-sm">
        Revisa tu email — te enviamos un enlace para restablecer la contraseña.
      </div>
    )
  }

  return (
    <div className="relative space-y-4">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md backdrop-blur-[2px]"
             style={{ background: 'rgba(15,15,18,0.6)' }}>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#F5F6F7' }} />
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: '#F5F6F7' }}>
              Enviando enlace…
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </span>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>
    </div>
  )
}
