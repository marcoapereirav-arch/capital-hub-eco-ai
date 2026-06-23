"use client"

import { useEffect, useState } from "react"
import { Loader2, Copy, Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type AffiliateStat = { leads: number; agendados: number; alumnos: number; total: number; revenue: number }
type Affiliate = { slug: string; name: string; active: boolean; link: string; stats: AffiliateStat }

/**
 * Subsección Afiliados: cada fuente de tráfico (Paolo, JP…) con su link único
 * (?utm_source=<slug>) y sus stats leídas de contacts.affiliate_slug.
 * Es la "vista bonita" encima de la atribución (UTM → tag fuente: → contacto → venta).
 */
export function AdsAffiliatesPanel() {
  const [rows, setRows] = useState<Affiliate[] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/admin/affiliates")
    const data = await res.json().catch(() => ({ affiliates: [] }))
    setRows(data.affiliates ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function copyLink(slug: string, link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(slug)
      setTimeout(() => setCopied((c) => (c === slug ? null : c)), 1500)
    } catch {
      /* ignore */
    }
  }

  async function createAffiliate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (newName.trim().length < 2) {
      setError("Pon un nombre")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear")
      } else {
        setNewName("")
        await load()
      }
    } finally {
      setCreating(false)
    }
  }

  if (rows === null) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando afiliados…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Crear afiliado */}
      <form onSubmit={createAffiliate} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del afiliado (ej. Paolo)"
          className="h-9 flex-1 rounded-sm border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating}
          className="flex h-9 items-center justify-center gap-1.5 rounded-sm border border-foreground bg-foreground px-3 text-xs font-mono uppercase tracking-wide text-background disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Añadir afiliado
        </button>
      </form>
      {error && <p className="text-xs text-foreground border-l-2 border-foreground pl-2">{error}</p>}

      {/* Lista */}
      {rows.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Aún no hay afiliados. Crea el primero arriba.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <div key={a.slug} className="rounded-sm border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">{a.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    utm_source={a.slug}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(a.slug, a.link)}
                  className="flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-2.5 py-1.5 text-[11px] hover:bg-secondary/70"
                >
                  {copied === a.slug ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === a.slug ? "Copiado" : "Copiar link"}
                </button>
              </div>

              {/* Link */}
              <p className="mt-2 break-all rounded-sm border border-border bg-secondary/40 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                {a.link}
              </p>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                <Stat label="Leads" value={a.stats.leads} />
                <Stat label="Agendados" value={a.stats.agendados} />
                <Stat label="Alumnos" value={a.stats.alumnos} />
                <Stat label="Revenue" value={`${a.stats.revenue.toLocaleString("es-ES")}€`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={cn("rounded-sm border border-border bg-secondary/30 px-2 py-1.5 text-center")}>
      <p className="font-heading text-base font-semibold text-foreground">{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}
