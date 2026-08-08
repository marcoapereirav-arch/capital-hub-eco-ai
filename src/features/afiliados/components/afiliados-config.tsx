"use client"

import { useState } from "react"
import { Check, Copy, Link2, Loader2, Plus, Trash2 } from "lucide-react"
import { ListaPaginada } from "@/components/ui/lista-paginada"
import { cn } from "@/lib/utils"
import { euros, type Afiliado, type FunnelDisponible } from "../types"

/**
 * Pestana CONFIGURACION: los afiliados, uno a uno.
 *
 * Lo que cambia respecto a lo que habia:
 *  · El link ya NO va siempre al Test de Personalidad. Se elige el funnel.
 *  · Se pueden crear varios links por afiliado, uno por funnel.
 *  · Se puede renombrar y desactivar. Desactivar no borra: sus numeros siguen contando.
 *
 * La lista de funnels llega de la API, que la saca del catalogo unico del OS. Un funnel
 * nuevo aparece aqui solo, sin tocar este archivo.
 */

export function AfiliadosConfig({
  afiliados,
  funnels,
  onCambio,
}: {
  afiliados: Afiliado[]
  funnels: FunnelDisponible[]
  onCambio: () => Promise<void> | void
}) {
  const [nombreNuevo, setNombreNuevo] = useState("")
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function crearAfiliado(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (nombreNuevo.trim().length < 2) {
      setError("Escribe el nombre de la persona")
      return
    }
    setCreando(true)
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombreNuevo.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear")
        return
      }
      setNombreNuevo("")
      await onCambio()
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Crear afiliado */}
      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h3 className="text-[17px] font-semibold text-foreground">Añadir afiliado</h3>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Una persona que trae tráfico con su propio enlace. Después le creas los links a los
          funnels que quieras.
        </p>
        <form onSubmit={crearAfiliado} className="mt-3 flex flex-col gap-2 md:flex-row">
          <input
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Nombre y apellido"
            autoComplete="off"
            enterKeyHint="done"
            className="h-11 w-full rounded-lg border border-border bg-secondary px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none md:h-9 md:min-w-0 md:flex-1 md:text-sm"
            disabled={creando}
          />
          <button
            type="submit"
            disabled={creando}
            className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9 md:text-sm"
          >
            {creando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            Añadir
          </button>
        </form>
        {error && (
          <p className="mt-2 border-l-2 border-destructive pl-2 text-[15px] text-destructive">
            {error}
          </p>
        )}
      </section>

      {afiliados.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
          <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay afiliados</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Crea el primero aquí arriba y después le das su link al funnel que quieras.
          </p>
        </div>
      ) : (
        <ListaPaginada
          items={afiliados}
          claveDeFiltros={`afiliados-${afiliados.length}`}
          nombreSingular="afiliado"
          nombrePlural="afiliados"
        >
          {(pagina) => (
            <div className="space-y-3">
              {pagina.map((a) => (
                <FichaDeAfiliado key={a.slug} afiliado={a} funnels={funnels} onCambio={onCambio} />
              ))}
            </div>
          )}
        </ListaPaginada>
      )}
    </div>
  )
}

function FichaDeAfiliado({
  afiliado,
  funnels,
  onCambio,
}: {
  afiliado: Afiliado
  funnels: FunnelDisponible[]
  onCambio: () => Promise<void> | void
}) {
  const [copiado, setCopiado] = useState<string | null>(null)
  const [funnelElegido, setFunnelElegido] = useState("")
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombre, setNombre] = useState(afiliado.name)

  const yaEnlazados = new Set(afiliado.links.map((l) => l.funnelSlug))
  const disponibles = funnels.filter((f) => !yaEnlazados.has(f.slug))

  async function copiar(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(id)
      setTimeout(() => setCopiado((c) => (c === id ? null : c)), 1500)
    } catch {
      setError("El navegador no dejó copiar. Selecciona el enlace y cópialo a mano.")
    }
  }

  async function crearLink() {
    if (!funnelElegido) return
    setError(null)
    setTrabajando(true)
    try {
      const res = await fetch("/api/admin/affiliates/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliate_slug: afiliado.slug, funnel_slug: funnelElegido }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear el link")
        return
      }
      setFunnelElegido("")
      await onCambio()
    } finally {
      setTrabajando(false)
    }
  }

  async function borrarLink(id: string) {
    setError(null)
    setTrabajando(true)
    try {
      const res = await fetch(`/api/admin/affiliates/links?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        setError("No se pudo borrar el link")
        return
      }
      await onCambio()
    } finally {
      setTrabajando(false)
    }
  }

  async function guardarCambio(cambios: { name?: string; active?: boolean }) {
    setError(null)
    setTrabajando(true)
    try {
      const res = await fetch(`/api/admin/affiliates/${encodeURIComponent(afiliado.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar")
        return
      }
      setEditandoNombre(false)
      await onCambio()
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 md:p-5",
        !afiliado.active && "opacity-70",
      )}
    >
      {/* Cabecera: nombre, etiqueta y estado.
          En el telefono va en dos filas: con los botones al lado, el nombre se cortaba a
          la mitad ("JP (Juan Pabl...") y los botones quedaban aplastados. Visto en la foto
          de 375, no deducido. */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          {editandoNombre ? (
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                enterKeyHint="done"
                className="h-11 w-full rounded-lg border border-border bg-secondary px-3 text-base text-foreground focus:border-ring focus:outline-none md:h-9 md:text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => guardarCambio({ name: nombre.trim() })}
                  disabled={trabajando || nombre.trim().length < 2}
                  className="h-11 flex-1 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground disabled:opacity-50 md:h-9 md:flex-none md:text-sm"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setNombre(afiliado.name)
                    setEditandoNombre(false)
                  }}
                  className="h-11 flex-1 rounded-lg border border-border px-4 text-[15px] text-foreground md:h-9 md:flex-none md:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="truncate text-[17px] font-semibold text-foreground">
                {afiliado.name}
                {!afiliado.active && (
                  <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                    desactivado
                  </span>
                )}
              </h3>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                Etiqueta en el CRM: {afiliado.etiqueta}
              </p>
            </>
          )}
        </div>

        {!editandoNombre && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setEditandoNombre(true)}
              className="h-11 flex-1 rounded-lg border border-border px-3 text-[15px] text-foreground active:bg-muted md:h-9 md:flex-none md:text-sm"
            >
              Renombrar
            </button>
            <button
              onClick={() => guardarCambio({ active: !afiliado.active })}
              disabled={trabajando}
              className="h-11 flex-1 rounded-lg border border-border px-3 text-[15px] text-foreground active:bg-muted disabled:opacity-50 md:h-9 md:flex-none md:text-sm"
            >
              {afiliado.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        )}
      </div>

      {/* Sus numeros */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <Dato etiqueta="Visitas" valor={afiliado.stats.visitas.toLocaleString("es-ES")} />
        <Dato etiqueta="Personas" valor={afiliado.stats.contactos.toLocaleString("es-ES")} />
        <Dato etiqueta="Agendaron" valor={afiliado.stats.agendados.toLocaleString("es-ES")} />
        <Dato etiqueta="Alumnos" valor={afiliado.stats.alumnos.toLocaleString("es-ES")} />
        <Dato etiqueta="Ingresos" valor={euros(afiliado.stats.ingresos)} />
      </div>

      {/* Sus links */}
      <div className="mt-4">
        <h4 className="text-[15px] font-semibold text-foreground">Sus links</h4>

        {afiliado.links.length === 0 ? (
          <p className="mt-1 text-[15px] text-muted-foreground">
            Todavía no tiene ninguno. Elige un funnel aquí abajo y se lo creas.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {afiliado.links.map((l) => (
              <li key={l.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                    {l.funnelLabel}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {l.stats.visitas} visitas · {l.stats.contactos} personas
                  </span>
                </div>

                <p className="mt-1.5 break-all rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-muted-foreground">
                  {l.url}
                </p>

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => l.url && copiar(l.id, l.url)}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-[15px] text-foreground active:bg-muted md:h-9 md:flex-none md:px-3 md:text-sm"
                  >
                    {copiado === l.id ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                    {copiado === l.id ? "Copiado" : "Copiar link"}
                  </button>
                  <button
                    onClick={() => borrarLink(l.id)}
                    disabled={trabajando}
                    className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-[15px] text-foreground active:bg-muted disabled:opacity-50 md:h-9 md:text-sm"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Crear link nuevo. El desplegable es el del sistema: en el telefono sale como
            rueda y se acierta con el dedo. */}
        {disponibles.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <select
              value={funnelElegido}
              onChange={(e) => setFunnelElegido(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-secondary px-3 text-base text-foreground focus:border-ring focus:outline-none md:h-9 md:min-w-0 md:flex-1 md:text-sm"
            >
              <option value="">Elige el funnel al que lo mandas</option>
              {disponibles.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.label}
                  {f.publicado ? "" : " (sin publicar)"}
                </option>
              ))}
            </select>
            <button
              onClick={crearLink}
              disabled={!funnelElegido || trabajando}
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9 md:text-sm"
            >
              {trabajando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden />
              )}
              Crear link
            </button>
          </div>
        ) : (
          <p className="mt-3 text-[15px] text-muted-foreground">
            Ya tiene un link para cada funnel que existe hoy.
          </p>
        )}
      </div>

      {error && (
        <p className="mt-2 border-l-2 border-destructive pl-2 text-[15px] text-destructive">
          {error}
        </p>
      )}
    </article>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-2 py-2 text-center">
      <p className="text-[17px] font-semibold tabular-nums text-foreground">{valor}</p>
      <p className="text-sm text-muted-foreground">{etiqueta}</p>
    </div>
  )
}
