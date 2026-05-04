import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Capital Hub — empieza GRATIS tu carrera remota en 90 días"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0F0F12 0%, #16161B 50%, #0F0F12 100%)",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: "#37CA37",
            }}
          />
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#9CA3AF",
              fontFamily: "monospace",
            }}
          >
            CAPITAL HUB · MIFGE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 80,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              maxWidth: 980,
              textTransform: "uppercase",
            }}
          >
            Tu primer trabajo remoto en menos de 90 días.
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#9CA3AF",
              maxWidth: 880,
            }}
          >
            Empieza GRATIS. 14 días sin pagar nada. Cancela cuando quieras.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #2A2D34",
            paddingTop: 28,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontFamily: "monospace",
              color: "#6B7280",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            capitalhubapp.com
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 24px",
              border: "1px solid #37CA37",
              background: "rgba(55, 202, 55, 0.08)",
              color: "#37CA37",
              fontSize: 18,
              fontFamily: "monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderRadius: 4,
            }}
          >
            QUIERO MI PRUEBA GRATUITA →
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
