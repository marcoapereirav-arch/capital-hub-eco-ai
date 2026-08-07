"use client"

import { useEffect, useState } from "react"
import { Loader2, Copy, Check, Plus } from "lucide-react"
import { LoadingScreen } from "@/components/ui/loading-screen"

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
    return <LoadingScreen fullscreen={false} className="min-h-[200px] rounded-lg" />
  }

  return (
    <div className="space-y-5">
      {/* Crear afiliado: campo a ancho completo y accion debajo en telefono */}
      <form onSubmit={createAffiliate} className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del afiliado (ej. Paolo)"
          enterKeyHint="done"
          className="h-11 w-full rounded-lg border border-border bg-secondary px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none md:h-8 md:min-w-0 md:flex-1 md:text-sm"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-8 md:text-sm"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Añadir afiliado
        </button>
      </form>
      {error && <p className="border-l-2 border-destructive pl-2 text-sm text-destructive">{error}</p>}

      {/* Lista */}
      {rows.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay afiliados</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Aún no hay afiliados. Crea el primero arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <div key={a.slug} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-[15px] font-semibold text-foreground">{a.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    utm_source={a.slug}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(a.slug, a.link)}
                  className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground active:bg-secondary/70 md:h-8"
                >
                  {copied === a.slug ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === a.slug ? "Copiado" : "Copiar link"}
                </button>
              </div>

              {/* Link */}
              <p className="mt-2 rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm break-all text-muted-foreground">
                {a.link}
              </p>

              {/* Fila de numeros: dos columnas en telefono, cuatro en monitor */}
              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
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
    <div className="rounded-lg border border-border bg-secondary/30 px-2 py-2 text-center">
      <p className="font-heading text-base font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
