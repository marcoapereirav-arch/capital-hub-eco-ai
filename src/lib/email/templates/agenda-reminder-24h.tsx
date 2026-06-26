import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  fullName: string
  slotStartIso: string
  meetingUrl: string
  durationMinutes?: number
}

/**
 * Recordatorio 24h antes de la llamada. Sin em-dash, duracion variable.
 */
export function AgendaReminder24hEmail({ fullName, slotStartIso, meetingUrl, durationMinutes }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  const date = new Date(slotStartIso)
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
  const dur = durationMinutes && durationMinutes > 0 ? ` de ${durationMinutes} minutos` : ""

  return (
    <EmailLayout preview={`Manana hablamos a las ${timeStr}. Te paso el link y como prepararte.`}>
      <H1>Manana hablamos{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Recordatorio rapido: <strong style={{ color: emailColors.text }}>{dateStr} a las {timeStr}</strong> tenemos nuestra llamada{dur}.
      </P>

      <Button href={meetingUrl}>Abrir la videollamada</Button>

      <P dim>
        Antes de la llamada, 5 minutos para esto:<br />
        Estate en un sitio tranquilo con buena conexion.<br />
        Camara y audio listos.<br />
        2 o 3 dudas concretas anotadas.<br />
        Piensa: que te gustaria cambiar profesionalmente este ano.
      </P>

      <P dim>
        Si te surge un imprevisto, responde a este email cuanto antes.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Hasta manana,</Text>
      <Text style={{ fontSize: 14, color: emailColors.text, margin: "0 0 4px" }}>Adrian Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
