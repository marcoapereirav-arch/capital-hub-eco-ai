"use client"

import { useState } from "react"
import { Lock, AlertCircle, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function AcceptInvitePage({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error")
        return
      }
      setSuccess(data.email)
      // Tras crear contraseña → bienvenida con confetti (luego dashboard)
      setTimeout(() => router.push("/welcome"), 1500)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <Check className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Cuenta lista</h1>
          <p className="text-muted-foreground mb-4">{success}</p>
          <p className="text-muted-foreground text-xs">Redirigiendo al login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative">
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(15,15,18,0.7)" }}>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-foreground" />
            <span className="text-xs font-mono uppercase tracking-wider text-foreground">
              Activando tu cuenta…
            </span>
          </div>
        </div>
      )}
      <form onSubmit={submit} className="max-w-md w-full bg-card border border-border rounded-md p-6 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 border border-border px-3 py-1 rounded-lg mb-4">
            <Lock className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Configura tu contraseña
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Capital Hub OS</h1>
          <p className="text-muted-foreground text-sm mt-1">Define una contraseña para entrar al sistema.</p>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Contraseña (mín 8 caracteres)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base md:text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Confirma contraseña
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base md:text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-white text-primary-foreground font-mono uppercase tracking-wider py-3 rounded-lg hover:opacity-90 disabled:opacity-30 inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Activando…
            </>
          ) : (
            "Activar mi cuenta"
          )}
        </button>
      </form>
    </div>
  )
}
