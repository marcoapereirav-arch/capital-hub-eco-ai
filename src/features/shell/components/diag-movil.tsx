"use client"

import { useEffect } from "react"

/**
 * Manda las medidas REALES del telefono, una sola vez por sesion.
 *
 * Existe porque la franja negra de abajo se me escapo cinco veces: yo mido en un
 * navegador donde las zonas seguras valen CERO, asi que cada intento era una
 * hipotesis. Con esto la app manda los numeros sola en cuanto se abre.
 *
 * Es TEMPORAL. Se borra en cuanto la franja quede resuelta.
 */
export function DiagMovil() {
  useEffect(() => {
    // SOLO desde un telefono. La primera vez midio desde el Mac de Marco y piso
    // la medida buena: en el ordenador las zonas seguras tambien valen cero, asi
    // que ese dato no sirve para nada y encima tapaba el que hacia falta.
    const esTelefono =
      window.matchMedia("(max-width: 767px)").matches ||
      window.matchMedia("(display-mode: standalone)").matches
    if (!esTelefono) return

    if (sessionStorage.getItem("diag-enviado")) return
    sessionStorage.setItem("diag-enviado", "1")

    const t = setTimeout(() => {
      const cs = getComputedStyle(document.documentElement)
      const leer = (n: string) => cs.getPropertyValue(n).trim() || "(vacio)"

      // Una caja fija pegada abajo dice DONDE acaba de verdad lo que se ancla.
      const sonda = document.createElement("div")
      sonda.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;height:1px;pointer-events:none;opacity:0"
      document.body.appendChild(sonda)
      const finDeLoFijo = Math.round(sonda.getBoundingClientRect().bottom)
      sonda.remove()

      // Y donde acaba la barra de abajo de verdad.
      let finDeLaBarra: number | null = null
      let altoDeLaBarra: number | null = null
      let rellenoDeLaBarra: string | null = null
      for (const n of Array.from(document.querySelectorAll("nav"))) {
        const c = getComputedStyle(n)
        const r = n.getBoundingClientRect()
        if (c.position === "fixed" && r.width > window.innerWidth * 0.8 && r.height > 30) {
          finDeLaBarra = Math.round(r.bottom)
          altoDeLaBarra = Math.round(r.height)
          rellenoDeLaBarra = c.paddingBottom
        }
      }

      fetch("/api/diag/marco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ventana: { ancho: window.innerWidth, alto: window.innerHeight },
          pantalla: { ancho: window.screen.width, alto: window.screen.height },
          pixelesPorPunto: window.devicePixelRatio,
          zonaSegura: { arriba: leer("--sat"), abajo: leer("--sab") },
          finDeLoFijo,
          finDeLaBarra,
          altoDeLaBarra,
          rellenoDeLaBarra,
          instalada: window.matchMedia("(display-mode: standalone)").matches,
          agente: navigator.userAgent.slice(0, 120),
        }),
      }).catch(() => {})
    }, 1500)

    return () => clearTimeout(t)
  }, [])

  return null
}
