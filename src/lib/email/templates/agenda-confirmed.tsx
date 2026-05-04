import * as React from "react"
import { EmailLayout, H1, P, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  slotStartIso: string
  meetingUrl?: string | null
}

export function AgendaConfirmedEmail({ fullName, slotStartIso, meetingUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  const date = new Date(slotStartIso)
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  return (
    <EmailLayout preview={`Confirmada tu llamada el ${dateStr} a las ${timeStr}.`}>
      <H1>Confirmada{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Tu llamada de 20 minutos conmigo está reservada. Te dejo los detalles:
      </P>

      <Section style={{ backgroundColor: "rgba(55, 202, 55, 0.06)", border: `1px solid ${emailColors.accent}`, padding: 18, margin: "20px 0", borderRadius: 4 }}>
        <Text style={{ fontSize: 12, color: emailColors.accent, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>
          Tu cita
        </Text>
        <Text style={{ fontSize: 18, color: emailColors.text, fontWeight: 600, margin: "0 0 4px", textTransform: "capitalize" }}>
          {dateStr}
        </Text>
        <Text style={{ fontSize: 16, color: emailColors.text, margin: 0 }}>
          {timeStr} (hora España) · 20 minutos
        </Text>
        {meetingUrl && (
          <Text style={{ fontSize: 13, color: emailColors.textDim, margin: "12px 0 0" }}>
            Link de la llamada:{" "}
            <a href={meetingUrl} style={{ color: emailColors.text }}>{meetingUrl}</a>
          </Text>
        )}
      </Section>

      <Text style={{ fontSize: 14, color: emailColors.textDim, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "24px 0 12px" }}>
        Cómo prepararte
      </Text>
      <P dim>
        · Cámara y audio en sitio tranquilo<br />
        · Libreta o notas para apuntar<br />
        · Piensa: ¿qué situación profesional quieres cambiar?<br />
        · 2-3 dudas concretas que tengas
      </P>

      <P dim>
        Si necesitas reagendar, responde a este email.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
