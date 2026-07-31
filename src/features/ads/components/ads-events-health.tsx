"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Check, ChevronDown, Minus, RefreshCw, Target, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * "¿Está midiendo o no?". La pantalla que faltaba.
 *
 * Un funnel por tarjeta y, dentro, cada evento que DEBERÍA estar disparando con la última
 * vez que llegó a Meta. Un evento que se espera y nunca llegó sale en rojo: antes eso era
 * invisible y solo se notaba cuando las campañas no optimizaban.
 *
 * Diseño con el brandkit real (carbón, verde #22C55E, Inter Tight, esquinas de 4 y 8px).
 * OJO: en el OS el token `accent` vale gris #2A2D34 y `font-heading` cae en la fuente del
 * sistema, así que aquí los valores van explícitos. Ver SOP marketing/brand/01.
 */

type EventRow = {
  name: string
  when: string
  kind: "estandar" | "nuestro"
  lastAt: string | null
  sent: number
  failed: number
  neverSeen: boolean
}

type FunnelRow = {
  slug: string
  label: string
  path: string
  name: string
  optimizeFor: string | null
  published: boolean
  status: string
  trackingEnabled: boolean
  healthy: boolean
  events: EventRow[]
}

const VERDE = "#22C55E"
const VERDE_CLARO = "#4ADE80"
const AMBAR = "#E5B567"
const ROJO = "#E5675B"
const LINEA = "rgba(245,246,247,0.1)"
const TIPO = "'Inter Tight', sans-serif"

function hace(iso: string | null): string {
  if (!iso) return "nunca"
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return "ahora mismo"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? "ayer" : `hace ${d} días`
}

export function AdsEventsHealth() {
  const [data, setData] = useState<{ capiMode: string; funnels: FunnelRow[] } | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ads/funnels-status", { cache: "no-store" })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading && !data) {
    return (
      <div
        className="rounded-lg border p-6 text-[15px]"
        style={{ borderColor: LINEA, background: "#131318", color: "#A6AAB2", fontFamily: TIPO }}
      >
        Revisando qué está midiendo…
      </div>
    )
  }

  const funnels = data?.funnels ?? []
  const midiendo = funnels.filter((f) => f.trackingEnabled)
  const rotos = midiendo.filter((f) => !f.healthy)
  const enPrueba = data?.capiMode === "test"
  const todoBien = !enPrueba && midiendo.length > 0 && rotos.length === 0

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: TIPO }}>
      {/* ── El veredicto. Lo primero y lo más grande ── */}
      <section
        className="rounded-lg border p-5 md:p-6"
        style={{
          borderColor: todoBien ? "#24462F" : LINEA,
          background: todoBien ? "#101710" : "#131318",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: VERDE_CLARO }}>
              Estado de la medición
            </p>
            <h3
              className="mt-2 text-[26px] leading-[1.1] tracking-tight md:text-[32px]"
              style={{ fontWeight: 900, color: "#F5F6F7" }}
            >
              {enPrueba
                ? "Meta está tirando tus conversiones"
                : rotos.length > 0
                  ? `${rotos.length} ${rotos.length === 1 ? "funnel tiene" : "funnels tienen"} un evento que no llega`
                  : midiendo.length === 0
                    ? "No hay ningún funnel midiendo"
                    : "Todo está midiendo correctamente"}
            </h3>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
              {enPrueba
                ? "El envío está en modo prueba: Meta recibe los eventos y los descarta. No optimizan tus campañas ni construyen audiencias. Cámbialo en Ajustes."
                : rotos.length > 0
                  ? "Un evento en rojo no significa que no haya entrado nadie: significa que no está saltando."
                  : midiendo.length === 0
                    ? "Enciende la medición de un funnel desde su tarjeta en Webs."
                    : `${midiendo.length} funnels mandando eventos reales a Facebook Ads.`}
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded border px-3.5 text-[14px] font-semibold transition-opacity disabled:opacity-50"
            style={{ borderColor: LINEA, color: "#A6AAB2" }}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </button>
        </div>

        {/* Tres números, a la vista */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Dato n={midiendo.length} label="funnels midiendo" />
          <Dato
            n={midiendo.reduce((a, f) => a + f.events.filter((e) => !e.neverSeen).length, 0)}
            label="eventos llegando"
            color={VERDE_CLARO}
          />
          <Dato
            n={midiendo.reduce((a, f) => a + f.events.filter((e) => e.neverSeen).length, 0)}
            label="sin llegar nunca"
            color={ROJO}
          />
        </div>
      </section>

      {/* ── Una tarjeta por funnel ── */}
      {funnels.map((f) => (
        <section
          key={f.slug}
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: LINEA, background: "#131318" }}
        >
          <header
            className="flex flex-wrap items-center gap-3 border-b px-5 py-4"
            style={{ borderColor: LINEA }}
          >
            <Semaforo ok={f.healthy} apagado={!f.trackingEnabled} />

            <div className="min-w-0 flex-1">
              <p className="text-[17px] leading-tight" style={{ fontWeight: 800, color: "#F5F6F7" }}>
                {f.name}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "#7C818A" }}>
                {f.path}
              </p>
            </div>

            <Chip texto={f.published ? "Publicado" : "Borrador"} activo={f.published} />
            <Chip texto={f.trackingEnabled ? "Midiendo" : "Sin medir"} activo={f.trackingEnabled} />
          </header>

          {f.optimizeFor && f.trackingEnabled && (
            <div
              className="flex items-center gap-2.5 border-b px-5 py-3"
              style={{ borderColor: LINEA, background: "#101710" }}
            >
              <Target className="h-4 w-4 shrink-0" style={{ color: VERDE_CLARO }} />
              <span className="text-[14px]" style={{ color: "#A6AAB2" }}>
                Su campaña en Facebook Ads debe optimizar hacia{" "}
                <strong style={{ fontWeight: 700, color: "#F5F6F7" }}>{f.optimizeFor}</strong>
              </span>
            </div>
          )}

          {f.events.length === 0 ? (
            <p className="px-5 py-5 text-[15px]" style={{ color: "#7C818A" }}>
              Este funnel no tiene eventos asignados.
            </p>
          ) : (
            <ul>
              {f.events.map((e) => (
                <li
                  key={e.name}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b px-5 py-3.5 last:border-b-0"
                  style={{ borderColor: LINEA }}
                >
                  <EstadoEvento evento={e} />

                  <div className="min-w-0 flex-1">
                    <p className="text-[15px]" style={{ fontWeight: 600, color: "#F5F6F7" }}>
                      {e.when}
                    </p>
                    <p className="mt-0.5 text-[13px]" style={{ color: "#7C818A" }}>
                      {e.name} · {e.kind === "estandar" ? "evento de Meta" : "evento nuestro"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className="text-[14px]"
                      style={{ fontWeight: 600, color: e.neverSeen ? ROJO : "#A6AAB2" }}
                    >
                      {e.neverSeen ? "nunca ha saltado" : hace(e.lastAt)}
                    </p>
                    {!e.neverSeen && (
                      <p className="mt-0.5 text-[13px]" style={{ color: "#7C818A" }}>
                        {e.sent} {e.sent === 1 ? "envío" : "envíos"}
                        {e.failed > 0 && <span style={{ color: ROJO }}> · {e.failed} fallaron</span>}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

function Dato({ n, label, color = "#F5F6F7" }: { n: number; label: string; color?: string }) {
  return (
    <div className="rounded border px-3.5 py-3" style={{ borderColor: LINEA }}>
      <p className="text-[28px] leading-none" style={{ fontWeight: 900, color }}>
        {n}
      </p>
      <p className="mt-1.5 text-[13px] leading-snug" style={{ color: "#7C818A" }}>
        {label}
      </p>
    </div>
  )
}

function Chip({ texto, activo }: { texto: string; activo: boolean }) {
  return (
    <span
      className="shrink-0 rounded-[3px] border px-2.5 py-1 text-[13px]"
      style={{
        fontWeight: 600,
        borderColor: activo ? "#24462F" : LINEA,
        background: activo ? "#101710" : "transparent",
        color: activo ? VERDE_CLARO : "#7C818A",
      }}
    >
      {texto}
    </span>
  )
}

function EstadoEvento({ evento }: { evento: EventRow }) {
  if (evento.neverSeen) return <X className="h-[18px] w-[18px] shrink-0" style={{ color: ROJO }} />
  if (evento.failed > 0)
    return <AlertTriangle className="h-[18px] w-[18px] shrink-0" style={{ color: AMBAR }} />
  return <Check className="h-[18px] w-[18px] shrink-0" style={{ color: VERDE_CLARO }} />
}

function Semaforo({ ok, apagado }: { ok: boolean; apagado: boolean }) {
  if (apagado) {
    return <Minus className="h-4 w-4 shrink-0" style={{ color: "#7C818A" }} />
  }
  return (
    <span
      aria-hidden
      className="h-2.5 w-2.5 shrink-0 rounded-full"
      style={{
        background: ok ? VERDE : ROJO,
        boxShadow: `0 0 10px ${ok ? "rgba(34,197,94,0.8)" : "rgba(229,103,91,0.7)"}`,
      }}
    />
  )
}

/**
 * El registro crudo de envíos, plegado. Es una herramienta de depuración: solo hace falta
 * cuando algo falla, así que no puede ser lo primero que se ve al entrar.
 */
export function RegistroTecnico({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <section
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: LINEA, background: "#131318", fontFamily: TIPO }}
    >
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex min-h-11 w-full items-center gap-3 px-5 py-4 text-left"
      >
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", abierto && "rotate-180")}
          style={{ color: "#7C818A" }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px]" style={{ fontWeight: 700, color: "#F5F6F7" }}>
            Registro técnico
          </p>
          <p className="mt-0.5 text-[13px]" style={{ color: "#7C818A" }}>
            Cada envío con la respuesta exacta de Meta. Solo hace falta si algo falla.
          </p>
        </div>
      </button>

      {abierto && (
        <div className="border-t px-5 py-5" style={{ borderColor: LINEA }}>
          {children}
        </div>
      )}
    </section>
  )
}
