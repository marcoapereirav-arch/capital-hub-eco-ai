"use client"

import { useEffect, useState } from "react"
import { Check, KeyRound, Loader2, Trash2, TriangleAlert } from "lucide-react"

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
 */

const VERDE_CLARO = "#4ADE80"
const AMBAR = "#E5B567"
const ROJO = "#E5675B"
const LINEA = "rgba(245,246,247,0.1)"
const PANEL = "#131318"
const TIPO = "'Inter Tight', sans-serif"

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
      className="rounded-lg border p-5 md:p-6"
      style={{
        borderColor: listo ? "#24462F" : "rgba(229,181,103,0.35)",
        background: listo ? "#101710" : PANEL,
        fontFamily: TIPO,
      }}
    >
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0" style={{ color: listo ? VERDE_CLARO : AMBAR }} />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] leading-tight" style={{ fontWeight: 800, color: "#F5F6F7" }}>
            Llave para ver el gasto de las campañas
          </p>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "#A6AAB2" }}>
            Es distinta de la de conversiones. Esa manda los eventos a Meta, esta lee lo que
            gastan tus campañas. Sin ella la pestaña de Campañas sale vacía, pero la medición
            de los funnels funciona igual.
          </p>
        </div>
      </div>

      {listo && (
        <div className="mt-5 rounded border px-4 py-3" style={{ borderColor: LINEA }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Check className="h-4 w-4 shrink-0" style={{ color: VERDE_CLARO }} />
            <span className="text-[15px]" style={{ fontWeight: 600, color: "#F5F6F7" }}>
              Configurada
            </span>
            <span className="text-[14px]" style={{ color: "#7C818A" }}>
              {info?.tapado}
            </span>
            <span className="text-[14px]" style={{ color: "#A6AAB2" }}>
              {caduca(info?.expiresAt ?? null)}
            </span>
            {info?.origen === "entorno" && (
              <span className="text-[13px]" style={{ color: "#7C818A" }}>
                puesta en el proyecto, no desde aquí
              </span>
            )}
            {info?.origen === "pantalla" && (
              <button
                type="button"
                onClick={borrar}
                disabled={guardando}
                className="ml-auto flex min-h-11 items-center gap-1.5 text-[14px] disabled:opacity-50"
                style={{ color: "#7C818A" }}
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
          className="block text-[14px]"
          style={{ fontWeight: 600, color: "#F5F6F7" }}
        >
          {listo ? "Cambiarla por otra" : "Pega aquí la llave"}
        </label>
        <p className="mt-1 text-[14px]" style={{ color: "#7C818A" }}>
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
            className="min-h-11 flex-1 rounded border px-3.5 text-[15px] outline-none"
            style={{ borderColor: LINEA, background: "#0F0F12", color: "#F5F6F7" }}
          />
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || valor.trim().length < 20}
            className="flex min-h-11 items-center justify-center gap-2 rounded px-5 text-[15px] transition-opacity disabled:opacity-40"
            style={{ fontWeight: 700, background: "#22C55E", color: "#08130C" }}
          >
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar y probar
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mt-4 flex items-start gap-3 rounded border p-4"
          style={{ borderColor: "rgba(229,103,91,0.4)", background: "rgba(229,103,91,0.07)" }}
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ROJO }} />
          <div>
            <p className="text-[15px]" style={{ fontWeight: 700, color: "#F5F6F7" }}>
              {error}
            </p>
            {detalle && (
              <p className="mt-1 text-[14px] leading-relaxed" style={{ color: "#A6AAB2" }}>
                Meta responde: {detalle}
              </p>
            )}
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "#7C818A" }}>
              No se ha guardado nada. Comprueba que al generarla marcaste el permiso
              ads_read y que el usuario del sistema tiene tu cuenta publicitaria asignada.
            </p>
          </div>
        </div>
      )}

      {exito && (
        <div
          className="mt-4 flex items-start gap-3 rounded border p-4"
          style={{ borderColor: "#24462F", background: "#101710" }}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: VERDE_CLARO }} />
          <p className="text-[15px] leading-relaxed" style={{ color: "#F5F6F7" }}>
            {exito} Ya puedes abrir la pestaña de Campañas.
          </p>
        </div>
      )}
    </section>
  )
}
