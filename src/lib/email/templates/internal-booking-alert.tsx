import * as React from "react"
import { EmailLayout, P, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  email: string
  phone?: string | null
  slotStartIso: string
  notes?: string | null
}

/** Email a Adrián cada vez que alguien agenda llamada. */
export function InternalBookingAlert({ fullName, email, phone, slotStartIso, notes }: Props) {
  const date = new Date(slotStartIso)
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  return (
    <EmailLayout preview={`Nueva llamada agendada: ${fullName} el ${dateStr} a las ${timeStr}`}>
      <Text style={{ fontFamily: "monospace", fontSize: 11, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
        🔔 NUEVA LLAMADA AGENDADA
      </Text>

      <Section style={{ backgroundColor: emailColors.surface, border: `1px solid ${emailColors.border}`, padding: 16, margin: "16px 0", borderRadius: 4 }}>
        <Text style={{ fontSize: 18, color: emailColors.text, fontWeight: 600, margin: "0 0 4px", textTransform: "capitalize" }}>{dateStr}</Text>
        <Text style={{ fontSize: 16, color: emailColors.text, margin: 0 }}>{timeStr} (hora España) · 20 min</Text>
      </Section>

      <Section style={{ borderLeft: `2px solid ${emailColors.border}`, paddingLeft: 14, margin: "20px 0" }}>
        <Text style={{ fontFamily: "monospace", fontSize: 10, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Lead</Text>
        <Text style={{ fontSize: 15, color: emailColors.text, fontWeight: 600, margin: "0 0 4px" }}>{fullName}</Text>
        <Text style={{ fontSize: 13, color: emailColors.textDim, margin: 0 }}>
          📧 <a href={`mailto:${email}`} style={{ color: emailColors.text }}>{email}</a>
        </Text>
        {phone && (
          <Text style={{ fontSize: 13, color: emailColors.textDim, margin: "4px 0 0" }}>
            📞 <a href={`tel:${phone}`} style={{ color: emailColors.text }}>{phone}</a>
          </Text>
        )}
      </Section>

      {notes && (
        <>
          <Text style={{ fontFamily: "monospace", fontSize: 10, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "16px 0 6px" }}>Notas que dejó</Text>
          <Section style={{ backgroundColor: emailColors.bg, border: `1px solid ${emailColors.border}`, padding: 12, borderRadius: 4 }}>
            <Text style={{ fontSize: 13, color: emailColors.text, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{notes}</Text>
          </Section>
        </>
      )}

      <P dim>Ver/gestionar todas las llamadas en el panel: <a href="https://os.capitalhubapp.com/webs" style={{ color: emailColors.text }}>OS → Webs → Llamadas</a></P>
    </EmailLayout>
  )
}
