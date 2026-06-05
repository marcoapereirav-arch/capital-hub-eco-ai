"use client"

import { useState } from "react"
import { Lock, AlertCircle, Check } from "lucide-react"
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
      setTimeout(() => router.push("/login"), 2000)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <Check className="h-12 w-12 mx-auto mb-4 text-[#37CA37]" />
          <h1 className="text-2xl font-semibold text-white mb-2">Cuenta lista</h1>
          <p className="text-white/60 mb-4">{success}</p>
          <p className="text-white/40 text-xs">Redirigiendo al login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center px-6">
      <form onSubmit={submit} className="max-w-md w-full bg-[#16161B] border border-[#2A2D34] rounded-md p-6 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 border border-[#2A2D34] px-3 py-1 rounded-sm mb-4">
            <Lock className="h-3 w-3 text-[#37CA37]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
              Configura tu contraseña
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Capital Hub OS</h1>
          <p className="text-white/60 text-sm mt-1">Define una contraseña para entrar al sistema.</p>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1">
            Contraseña (mín 8 caracteres)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-sm border border-[#2A2D34] bg-[#0F0F12] px-3 py-2 text-sm text-white focus:border-[#37CA37] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1">
            Confirma contraseña
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-sm border border-[#2A2D34] bg-[#0F0F12] px-3 py-2 text-sm text-white focus:border-[#37CA37] focus:outline-none"
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
          className="w-full bg-[#37CA37] text-black font-mono uppercase tracking-wider py-3 rounded-sm hover:opacity-90 disabled:opacity-30"
        >
          {submitting ? "Activando…" : "Activar mi cuenta"}
        </button>
      </form>
    </div>
  )
}
