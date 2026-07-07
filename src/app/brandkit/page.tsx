"use client"

/*
 * BRANDKIT · Capital Hub
 *
 * Página de trabajo interna (localhost:3000/brandkit) para comparar versiones
 * del brandkit y elegir. Cada versión es un componente autocontenido; las
 * pestañas de arriba conmutan entre ellas. Solo se monta la versión activa.
 *
 * V1: primer rumbo (Monochrome Matte + contraste papel/carbón + dojo).
 * V2: luxury + dojo (copy oficial, cinturones visibles, cero guion largo).
 */

import { useState } from "react"
import { VersionOne } from "./version-one"
import { VersionTwo } from "./version-two"

type VersionId = "v1" | "v2"

const TABS: { id: VersionId; label: string }[] = [
  { id: "v1", label: "Versión 1" },
  { id: "v2", label: "Versión 2" },
]

const BASE_FONT = "'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif"

export default function BrandkitPage() {
  const [active, setActive] = useState<VersionId>("v2")

  return (
    <div style={{ minHeight: "100dvh", background: "#0F0F12" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          background: "rgba(15,15,18,0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid #2A2D34",
        }}
      >
        <span
          style={{
            fontFamily: BASE_FONT,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.24em",
            color: "#6B7280",
          }}
        >
          BRANDKIT
        </span>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {TABS.map((t) => {
            const on = t.id === active
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                style={{
                  fontFamily: BASE_FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "7px 16px",
                  borderRadius: 3,
                  cursor: "pointer",
                  border: on ? "1px solid #22C55E" : "1px solid #2A2D34",
                  background: on ? "#22C55E" : "transparent",
                  color: on ? "#08130C" : "#F5F6F7",
                  transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {active === "v1" ? <VersionOne /> : <VersionTwo />}
    </div>
  )
}
