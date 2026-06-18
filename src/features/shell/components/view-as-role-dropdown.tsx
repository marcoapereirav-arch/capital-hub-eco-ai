"use client"

import { Eye, ChevronDown, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const IMPERSONATABLE_ROLES: Array<{ value: string; label: string }> = [
  { value: "marketing", label: "Marketing" },
  { value: "formador", label: "Formador" },
  { value: "closer", label: "Closer" },
  { value: "setter", label: "Setter" },
]

/**
 * Dropdown visible solo para super_admin/admin que permite ver el OS como otro rol.
 * Setea la cookie view_as_role vía POST /api/admin/view-as y refresca la página.
 *
 * Si el admin ya está impersonando un rol, el ViewAsRoleBanner aparece arriba con
 * el botón "Volver a vista admin".
 */
export function ViewAsRoleDropdown({ currentViewAs }: { currentViewAs: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function pickRole(role: string | null) {
    setLoading(role ?? "_clear")
    try {
      await fetch("/api/admin/view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      router.refresh()
      setOpen(false)
    } finally {
      setLoading(null)
    }
  }

  const label = currentViewAs
    ? `Viendo como: ${IMPERSONATABLE_ROLES.find((r) => r.value === currentViewAs)?.label ?? currentViewAs}`
    : "Ver como rol"

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-between gap-1.5 rounded-sm border border-border bg-background px-2 py-1.5 text-xs hover:border-foreground/40 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          <Eye className="h-3 w-3 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-1 z-50 rounded-sm border border-border bg-background shadow-lg overflow-hidden">
            {currentViewAs && (
              <button
                onClick={() => pickRole(null)}
                disabled={loading !== null}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-secondary/50 disabled:opacity-50 border-b border-border"
              >
                <span className="font-mono uppercase tracking-wider text-muted-foreground">
                  Salir (vista admin)
                </span>
                {loading === "_clear" && <span className="text-[10px]">…</span>}
              </button>
            )}
            {IMPERSONATABLE_ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => pickRole(r.value)}
                disabled={loading !== null}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-secondary/50 disabled:opacity-50"
              >
                <span>{r.label}</span>
                {currentViewAs === r.value ? (
                  <Check className="h-3 w-3 text-foreground" />
                ) : loading === r.value ? (
                  <span className="text-[10px]">…</span>
                ) : null}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
