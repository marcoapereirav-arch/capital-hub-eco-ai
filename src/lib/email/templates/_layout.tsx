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
  // Accent del brandkit = BLANCO (monocromo). Antes era verde #37ca37 (off-brand,
  // neon prohibido). Las plantillas lo usan para bordes/texto de resaltado.
  accent: "#FAFAFA",
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
          backgroundColor: colors.white,
          color: colors.bg,
          padding: "13px 30px",
          fontSize: 14,
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
