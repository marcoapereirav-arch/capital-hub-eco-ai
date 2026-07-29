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
 * Recordatorio 1 hora antes de la llamada. Lo dispara el cron de recordatorios de
 * Calendly. Copy al grano, español neutro, sin em dash.
 */
export function AgendaReminder1hEmail({ fullName, slotStartIso, meetingUrl, durationMinutes }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  const date = new Date(slotStartIso)
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const dur = durationMinutes && durationMinutes > 0 ? `${durationMinutes} minutos` : null

  return (
    <EmailLayout preview={`En 1 hora hablamos a las ${timeStr}.`}>
      <H1>En 1 hora hablamos{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Hoy a las <strong style={{ color: emailColors.text }}>{timeStr}</strong> tenemos nuestra llamada{dur ? ` de ${dur}` : ""}. Deja el enlace a mano.
      </P>

      <Button href={meetingUrl}>Entrar a la videollamada</Button>

      <P dim>
        Busca un sitio tranquilo, con buena conexión, cámara y audio funcionando.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
