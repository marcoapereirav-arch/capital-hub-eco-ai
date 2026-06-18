"use client"

import { Eye, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const ROLE_LABEL: Record<string, string> = {
  marketing: "Marketing",
  formador: "Formador",
  closer: "Closer",
  setter: "Setter",
}

/**
 * Banner persistente cuando el admin está viendo el OS impersonando otro rol.
 * Aparece arriba de cada página dentro del layout (main).
 * Botón "Volver" llama al endpoint y refresca.
 */
export function ViewAsRoleBanner({ viewingAs }: { viewingAs: string }) {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  async function exitViewAs() {
    setExiting(true)
    try {
      await fetch("/api/admin/view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: null }),
      })
      router.refresh()
    } finally {
      setExiting(false)
    }
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 md:px-6 py-2 border-b"
      style={{ background: "#0F0F12", color: "#F5F6F7", borderColor: "#2A2D34" }}
    >
      <div className="flex items-center gap-2 text-xs">
        <Eye className="h-3.5 w-3.5" style={{ color: "#F5F6F7" }} />
        <span className="font-mono uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
          Vista impersonada · estás viendo el OS como
        </span>
        <strong className="font-semibold">{ROLE_LABEL[viewingAs] ?? viewingAs}</strong>
      </div>
      <button
        onClick={exitViewAs}
        disabled={exiting}
        className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-mono uppercase tracking-wider disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ background: "#FFFFFF", color: "#0F0F12" }}
      >
        <X className="h-3 w-3" />
        {exiting ? "Volviendo…" : "Volver a vista admin"}
      </button>
    </div>
  )
}
