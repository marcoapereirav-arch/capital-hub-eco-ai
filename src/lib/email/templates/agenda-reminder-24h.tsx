import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  fullName: string
  slotStartIso: string
  meetingUrl: string
}

export function AgendaReminder24hEmail({ fullName, slotStartIso, meetingUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  const date = new Date(slotStartIso)
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })

  return (
    <EmailLayout preview={`Mañana hablamos a las ${timeStr}. Te paso el link de la videollamada y cómo prepararte.`}>
      <H1>Mañana hablamos{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Recordatorio rápido: <strong style={{ color: emailColors.text }}>{dateStr} a las {timeStr}</strong> tenemos nuestra llamada de 20 minutos.
      </P>

      <Button href={meetingUrl}>Abrir la videollamada</Button>

      <P dim>
        Antes de la llamada, dale 5 minutos a esto:<br />
        · Estate en un sitio tranquilo con buena conexión<br />
        · Cámara y audio listos<br />
        · 2-3 dudas concretas anotadas<br />
        · Piensa: ¿qué te gustaría cambiar profesionalmente este año?
      </P>

      <P dim>
        Si te surge un imprevisto, responde a este email cuanto antes.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Hasta mañana,</Text>
      <Text style={{ fontSize: 14, color: emailColors.text, margin: "0 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
