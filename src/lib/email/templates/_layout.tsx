import * as React from "react"
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

/**
 * Layout base de las plantillas React Email. Brandkit Capital Hub — monocromo
 * matte, limpio, sin caja pesada: texto directo sobre el fondo #0F0F12 con
 * eyebrow "CAPITAL HUB", separadores finos y botón blanco (accent del brandkit).
 * Tipografía sans (NO serif). Consistente con el layout de los emails token-based.
 */
const colors = {
  bg: "#0F0F12",
  surface: "#18181B",
  border: "#2A2D34",
  text: "#FAFAFA",
  body: "#D1D5DB",
  textDim: "#9CA3AF",
  textMuted: "#6B7280",
  white: "#FFFFFF",
  /**
   * Acento del brandkit = VERDE OFICIAL. Ver `docs/sops/marketing/brand/01-brandkit-oficial`:
   * "Acento: SOLO el verde oficial #22C55E / #4ADE80".
   *
   * Estuvo en blanco por una correccion anterior que confundio el problema: lo prohibido
   * era el verde INVENTADO (#37ca37, un neon fuera de paleta), no el verde de la marca.
   * Al quitar el neon se quito tambien el acento, y los correos se quedaron sin el unico
   * color que tiene Capital Hub. Corregido al verde oficial (Marco, 2026-08-11).
   */
  accent: "#22C55E",
  accentSoft: "#4ADE80",
  /** Tinta que va ENCIMA del verde. Sobre #22C55E el blanco no contrasta; esta si. */
  onAccent: "#08130C",
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export function EmailLayout({ preview, children }: LayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, margin: 0, padding: 0, fontFamily: FONT }}>
        <Container style={{ maxWidth: "520px", margin: "0 auto", padding: "44px 24px" }}>
          <Section style={{ paddingBottom: 30, textAlign: "center" }}>
            <Text style={{ fontSize: 11, letterSpacing: "0.3em", color: colors.textMuted, margin: 0, textTransform: "uppercase", fontWeight: 600 }}>
              Capital Hub
            </Text>
          </Section>

          {children}

          <Hr style={{ borderColor: colors.border, margin: "30px 0 16px" }} />

          <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.6, margin: 0 }}>
            Capital Hub · Adrián Villanueva ·{" "}
            <Link href="https://os.capitalhubapp.com" style={{ color: colors.textMuted }}>
              os.capitalhubapp.com
            </Link>
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 8 }}>
            Si no quieres recibir más emails,{" "}
            <Link href="https://os.capitalhubapp.com/unsubscribe" style={{ color: colors.textMuted, textDecoration: "underline" }}>
              da de baja aquí
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const emailColors = colors

export function H1({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, color: colors.text, margin: "0 0 16px", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
      {children}
    </Text>
  )
}

export function P({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <Text style={{ fontSize: 15, color: dim ? colors.textDim : colors.body, lineHeight: 1.65, margin: "0 0 16px" }}>
      {children}
    </Text>
  )
}

export function Button({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ textAlign: "center", margin: "28px 0" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          // Verde de marca. Es el unico color de Capital Hub: el boton principal de un
          // correo es exactamente donde tiene que estar.
          backgroundColor: colors.accent,
          color: colors.onAccent,
          padding: "14px 32px",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: 0,
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        {children}
      </Link>
    </Section>
  )
}
