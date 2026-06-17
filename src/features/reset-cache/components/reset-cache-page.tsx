"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"

/**
 * Endpoint visual para limpiar cache, service worker y todo lo que el navegador
 * pueda tener guardado de versiones anteriores del OS.
 *
 * Marco lo abre cuando ve cosas viejas (ej. 404 fantasma de páginas que ya funcionan).
 */
export function ResetCachePage() {
  const [status, setStatus] = useState<"running" | "done" | "error">("running")
  const [log, setLog] = useState<string[]>([])

  function append(line: string) {
    setLog((prev) => [...prev, line])
  }

  useEffect(() => {
    ;(async () => {
      try {
        // 1. Unregister TODOS los Service Workers
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          for (const reg of regs) {
            await reg.unregister()
            append(`✓ Service Worker desregistrado: ${reg.scope}`)
          }
          if (regs.length === 0) append("✓ No había Service Workers")
        }

        // 2. Borrar TODOS los caches
        if ("caches" in window) {
          const names = await caches.keys()
          for (const name of names) {
            await caches.delete(name)
            append(`✓ Cache borrado: ${name}`)
          }
          if (names.length === 0) append("✓ No había caches que borrar")
        }

        // 3. Limpiar localStorage + sessionStorage
        try {
          const lsCount = localStorage.length
          localStorage.clear()
          sessionStorage.clear()
          append(`✓ localStorage limpio (${lsCount} keys)`)
        } catch {}

        setStatus("done")
        // 4. Redirigir a la URL deseada (si viene como ?next=) o al dashboard
        const params = new URLSearchParams(window.location.search)
        const next = params.get("next") || "/test-personalidad"
        setTimeout(() => {
          // Forzar reload completo para descargar todo desde server
          window.location.replace(next)
        }, 2500)
      } catch (e) {
        setStatus("error")
        append(`✗ Error: ${e instanceof Error ? e.message : String(e)}`)
      }
    })()
  }, [])

  return (
    <main
      className="min-h-[100dvh] flex items-center justify-center px-4 text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-md w-full space-y-6">
        <span
          className="block text-[11px] uppercase tracking-[0.3em] text-[#9CA3AF]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Capital Hub
        </span>

        <h1
          className="text-2xl md:text-3xl font-medium text-white"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          {status === "running" && "Limpiando cache…"}
          {status === "done" && "Listo. Redirigiendo…"}
          {status === "error" && "Algo falló"}
        </h1>

        <div className="border border-[#2A2D34] bg-[#18181B] p-4 space-y-1 max-h-72 overflow-y-auto">
          {log.map((line, i) => (
            <p
              key={i}
              className="text-[11px] text-[#D1D5DB] leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {line}
            </p>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          {status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "done" && <CheckCircle2 className="h-4 w-4 text-white" />}
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[11px] uppercase tracking-[0.2em]">
            {status === "running" && "En progreso"}
            {status === "done" && "Cache limpio · abriendo URL"}
            {status === "error" && "Revisa la consola"}
          </span>
        </div>

        <p
          className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280] pt-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Si quieres ir a otra URL, usa /reset-cache?next=/ruta
        </p>
      </div>
    </main>
  )
}
