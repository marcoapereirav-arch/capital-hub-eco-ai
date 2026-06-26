import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  fullName: string
  slotStartIso: string
  meetingUrl: string
}

/**
 * Recordatorio 30 minutos antes de la llamada. Cron lo dispara.
 * Copy directo, breve. Sin em-dash.
 */
export function AgendaReminder30minEmail({ fullName, slotStartIso, meetingUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  const date = new Date(slotStartIso)
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  return (
    <EmailLayout preview={`En 30 min nos vemos. Aqui el link.`}>
      <H1>Empezamos en 30 min{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        A las <strong style={{ color: emailColors.text }}>{timeStr}</strong> nos vemos en la videollamada. Te dejo el link a un click.
      </P>

      <Button href={meetingUrl}>Abrir la videollamada</Button>

      <P dim>Si tienes algun problema con el link, responde a este email.</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrian Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
