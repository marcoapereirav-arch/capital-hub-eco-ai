import * as React from "react"
import { EmailLayout, P, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

export type ErrorAlertItem = {
  source: "email" | "capi"
  template_or_event: string
  error: string
  occurred_at: string
  to_or_meta?: string | null
}

interface Props {
  windowMinutes: number
  emailFails: number
  capiFails: number
  items: ErrorAlertItem[]
}

/** Email a Marco cuando hay fallos en email/CAPI durante la última ventana. */
export function InternalErrorAlert({ windowMinutes, emailFails, capiFails, items }: Props) {
  const total = emailFails + capiFails
  return (
    <EmailLayout preview={`⚠️ ${total} fallo${total === 1 ? "" : "s"} en MIFGE (${windowMinutes}min)`}>
      <Text style={{ fontFamily: "monospace", fontSize: 11, color: "#FF6B6B", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
        ⚠️ ALERTA · MIFGE FUNNEL
      </Text>

      <Section style={{ backgroundColor: "rgba(255, 107, 107, 0.08)", border: "1px solid #FF6B6B", padding: 16, margin: "16px 0", borderRadius: 4 }}>
        <Text style={{ fontSize: 16, color: emailColors.text, fontWeight: 600, margin: "0 0 4px" }}>
          {total} fallo{total === 1 ? "" : "s"} en los últimos {windowMinutes} min
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.textDim, margin: 0 }}>
          {emailFails > 0 && `Email: ${emailFails}`}{emailFails > 0 && capiFails > 0 && " · "}{capiFails > 0 && `CAPI Meta: ${capiFails}`}
        </Text>
      </Section>

      <P>Detalle:</P>

      {items.slice(0, 25).map((it, i) => (
        <Section key={i} style={{ borderLeft: `2px solid ${emailColors.border}`, paddingLeft: 14, margin: "12px 0" }}>
          <Text style={{ fontFamily: "monospace", fontSize: 10, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
            {it.source === "email" ? "EMAIL" : "CAPI"} · {it.template_or_event}
          </Text>
          <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 4px" }}>{it.error}</Text>
          <Text style={{ fontSize: 11, color: emailColors.textDim, margin: 0 }}>
            {it.occurred_at}{it.to_or_meta ? ` · ${it.to_or_meta}` : ""}
          </Text>
        </Section>
      ))}

      {items.length > 25 && (
        <P dim>… y {items.length - 25} más. Ver tabla completa en Supabase.</P>
      )}

      <P dim>
        Tablas: <code style={{ fontFamily: "monospace" }}>email_logs</code> · <code style={{ fontFamily: "monospace" }}>meta_events_log</code>
      </P>
    </EmailLayout>
  )
}
