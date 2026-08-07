"use client"

import { useEffect, useState } from "react"
import { Check, KeyRound, Loader2, Trash2, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dónde se pega la llave que LEE las campañas de Meta.
 *
 * Antes esto solo se podía poner editando un fichero del proyecto y desplegando, así que
 * en la práctica dependía de un desarrollador. Ahora se pega aquí.
 *
 * Al guardar, el servidor hace tres cosas por su cuenta: la alarga (una llave sacada a
 * mano dura un par de horas, así pasa a durar meses), la prueba contra la cuenta
 * publicitaria de verdad, y solo la guarda si funciona. Si Meta la rechaza, se dice por
 * qué y no se guarda nada.
 *
 * La llave nunca vuelve al navegador: solo se enseña tapada.
 *
 * El color sale de los tokens del tema (src/app/globals.css), no escrito a mano: el verde
 * de marca es `primary`, el ámbar de aviso es `warn` y el rojo de error es `destructive`.
 */

type Info = {
  configurado: boolean
  origen: "pantalla" | "entorno" | null
  tapado: string | null
  expiresAt: string | null
  savedAt: string | null
}

function caduca(iso: string | null): string {
  if (!iso) return "No caduca"
  const dias = Math.round((new Date(iso).getTime() - Date.now()) / 86400000)
  if (dias < 0) return "Caducada"
  if (dias === 0) return "Caduca hoy"
  if (dias === 1) return "Caduca mañana"
  return `Caduca en ${dias} días`
}

export function MarketingTokenCard() {
  const [info, setInfo] = useState<Info | null>(null)
  const [valor, setValor] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  async function cargar() {
    const res = await fetch("/api/admin/ads/marketing-token", { cache: "no-store" })
    if (res.ok) setInfo(await res.json())
  }

  useEffect(() => {
    cargar()
  }, [])

  async function guardar() {
    setGuardando(true)
    setError(null)
    setDetalle(null)
    setExito(null)
    try {
      const res = await fetch("/api/admin/ads/marketing-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: valor }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar")
        setDetalle(json.detalle ?? null)
        return
      }
      setValor("")
      setExito(
        json.cuenta
          ? `Guardada y probada contra la cuenta "${json.cuenta}".`
          : "Guardada y probada contra tu cuenta publicitaria."
      )
      await cargar()
    } finally {
      setGuardando(false)
    }
  }

  async function borrar() {
    setGuardando(true)
    try {
      await fetch("/api/admin/ads/marketing-token", { method: "DELETE" })
      setExito(null)
      setError(null)
      await cargar()
    } finally {
      setGuardando(false)
    }
  }

  const listo = info?.configurado === true

  return (
    <section
      className={cn(
        "rounded-lg border p-5 md:p-6",
        listo ? "border-primary/30 bg-primary/5" : "border-warn/35 bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <KeyRound
          className={cn("mt-0.5 h-5 w-5 shrink-0", listo ? "text-primary" : "text-warn")}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] leading-tight font-extrabold text-foreground">
            Llave para ver el gasto de las campañas
          </p>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Es distinta de la de conversiones. Esa manda los eventos a Meta, esta lee lo que
            gastan tus campañas. Sin ella la pestaña de Campañas sale vacía, pero la medición
            de los funnels funciona igual.
          </p>
        </div>
      </div>

      {listo && (
        <div className="mt-5 rounded border border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-[15px] font-semibold text-foreground">
              Configurada
            </span>
            <span className="text-[14px] text-muted-foreground">
              {info?.tapado}
            </span>
            <span className="text-[14px] text-muted-foreground">
              {caduca(info?.expiresAt ?? null)}
            </span>
            {info?.origen === "entorno" && (
              <span className="text-sm text-muted-foreground">
                puesta en el proyecto, no desde aquí
              </span>
            )}
            {info?.origen === "pantalla" && (
              <button
                type="button"
                onClick={borrar}
                disabled={guardando}
                className="ml-auto flex min-h-11 items-center gap-1.5 text-[14px] text-muted-foreground disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Quitar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5">
        <label
          htmlFor="mkt-token"
          className="block text-[14px] font-semibold text-foreground"
        >
          {listo ? "Cambiarla por otra" : "Pega aquí la llave"}
        </label>
        <p className="mt-1 text-[14px] text-muted-foreground">
          La sacas en Meta: Configuración del negocio, Usuarios del sistema, Capital Hub OS,
          botón Generar token, marcando el permiso ads_read.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="mkt-token"
            type="password"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="EAAG..."
            autoComplete="off"
            spellCheck={false}
            className="min-h-11 flex-1 rounded border border-border bg-background px-3.5 text-[15px] text-foreground outline-none"
          />
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || valor.trim().length < 20}
            className="flex min-h-11 items-center justify-center gap-2 rounded bg-primary px-5 text-[15px] font-bold text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar y probar
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded border border-destructive/40 bg-destructive/7 p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-[15px] font-bold text-foreground">
              {error}
            </p>
            {detalle && (
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                Meta responde: {detalle}
              </p>
            )}
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              No se ha guardado nada. Comprueba que al generarla marcaste el permiso
              ads_read y que el usuario del sistema tiene tu cuenta publicitaria asignada.
            </p>
          </div>
        </div>
      )}

      {exito && (
        <div className="mt-4 flex items-start gap-3 rounded border border-primary/30 bg-primary/5 p-4">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[15px] leading-relaxed text-foreground">
            {exito} Ya puedes abrir la pestaña de Campañas.
          </p>
        </div>
      )}
    </section>
  )
}
