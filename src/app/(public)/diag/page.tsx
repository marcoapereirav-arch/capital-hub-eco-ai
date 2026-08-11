"use client"

import { useEffect, useState } from "react"

/**
 * Pantalla de diagnostico del marco del telefono.
 *
 * Existe porque la franja negra de abajo se me escapo cuatro veces: un navegador
 * sin pantalla da CERO en las zonas seguras, y hay DOS causas posibles que piden
 * arreglos OPUESTOS. Sin el dato del telefono de verdad, cualquier intento es
 * una moneda al aire.
 *
 * Se abre en el telefono, se hace una captura y ya se sabe cual de las dos es.
 * Se borra en cuanto quede resuelto.
 */
export default function DiagPage() {
  const [d, setD] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement)
    const leer = (n: string) => cs.getPropertyValue(n).trim() || "(vacio)"

    // una caja fija pegada abajo, para saber DONDE acaba de verdad
    const sonda = document.createElement("div")
    sonda.style.cssText = "position:fixed;left:0;right:0;bottom:0;height:1px;pointer-events:none"
    document.body.appendChild(sonda)
    const abajoDeLaSonda = sonda.getBoundingClientRect().bottom
    sonda.remove()

    setD({
      "Alto de la ventana": `${window.innerHeight}`,
      "Alto de la pantalla": `${window.screen.height}`,
      "100dvh": `${cs.getPropertyValue("--medida-dvh") || ""}`,
      "Zona segura ARRIBA": leer("--sat"),
      "Zona segura ABAJO": leer("--sab"),
      "Una caja fija abajo acaba en": `${Math.round(abajoDeLaSonda)}`,
      "Aplicacion instalada": window.matchMedia("(display-mode: standalone)").matches ? "SI" : "NO",
      "Pixeles por punto": `${window.devicePixelRatio}`,
    })
  }, [])

  return (
    <div className="min-h-dvh bg-background p-5 pt-safe text-foreground">
      <style>{`:root{--medida-dvh:100dvh}`}</style>
      <h1 className="mb-1 text-2xl font-extrabold">Diagnostico del telefono</h1>
      <p className="mb-5 text-base text-muted-foreground">
        Haz una captura de esta pantalla entera y mandamela. Con esto se cual de las
        dos causas es y lo arreglo a la primera.
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {d
          ? Object.entries(d).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
                <span className="text-base text-muted-foreground">{k}</span>
                <span className="text-base font-bold tabular-nums text-primary">{v}</span>
              </div>
            ))
          : <div className="px-4 py-6 text-base text-muted-foreground">midiendo…</div>}
      </div>

      <p className="mt-5 text-base text-muted-foreground">
        La barra verde de abajo esta pegada al borde a proposito: si ves negro por
        debajo de ella, ese negro es el fallo.
      </p>

      {/* Barra de prueba: verde chillon, pegada al borde, SIN ningun hueco reservado.
          Si aparece negro por debajo, es que lo fijo no llega al borde de la pantalla. */}
      <div className="fixed inset-x-0 bottom-0 h-12 bg-primary" />
    </div>
  )
}
