import * as React from "react"
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

const colors = {
  bg: "#0F0F12",
  surface: "#18181B",
  border: "#2A2D34",
  text: "#F5F6F7",
  textDim: "#9CA3AF",
  textMuted: "#6B7280",
  accent: "#37ca37",
}

export function EmailLayout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, margin: 0, padding: 0, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 24px" }}>
          <Section style={{ paddingBottom: 24 }}>
            <Text style={{ fontFamily: "Georgia, serif", fontSize: 18, letterSpacing: "0.2em", color: colors.text, margin: 0, textTransform: "uppercase" }}>
              Capital Hub
            </Text>
          </Section>

          <Section style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 4, padding: "32px 28px" }}>
            {children}
          </Section>

          <Hr style={{ borderColor: colors.border, margin: "32px 0 16px" }} />

          <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.6, margin: 0 }}>
            Capital Hub · Adrián Villanueva ·{" "}
            <Link href="https://ecoai.capitalhubapp.com" style={{ color: colors.textDim }}>
              ecoai.capitalhubapp.com
            </Link>
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 8 }}>
            Si no quieres recibir más emails,{" "}
            <Link href="https://ecoai.capitalhubapp.com/unsubscribe" style={{ color: colors.textDim, textDecoration: "underline" }}>
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
    <Text style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 600, color: colors.text, margin: "0 0 16px", lineHeight: 1.2 }}>
      {children}
    </Text>
  )
}

export function P({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <Text style={{ fontSize: 15, color: dim ? colors.textDim : colors.text, lineHeight: 1.6, margin: "0 0 16px" }}>
      {children}
    </Text>
  )
}

export function Button({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ textAlign: "center", margin: "24px 0" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: colors.accent,
          color: "#000000",
          padding: "14px 32px",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          borderRadius: 2,
          textDecoration: "none",
        }}
      >
        {children}
      </Link>
    </Section>
  )
}
