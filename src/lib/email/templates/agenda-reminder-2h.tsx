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
 * Recordatorio 2 horas antes de la llamada. Cron lo dispara.
 * No usa em-dash. Copy directo.
 */
export function AgendaReminder2hEmail({ fullName, slotStartIso, meetingUrl, durationMinutes }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  const date = new Date(slotStartIso)
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const dur = durationMinutes && durationMinutes > 0 ? `${durationMinutes} minutos` : null

  return (
    <EmailLayout preview={`En 2 horas hablamos a las ${timeStr}.`}>
      <H1>En 2 horas hablamos{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Recordatorio rapido: hoy a las <strong style={{ color: emailColors.text }}>{timeStr}</strong> tenemos nuestra llamada{dur ? ` de ${dur}` : ""}.
      </P>

      <Button href={meetingUrl}>Abrir la videollamada</Button>

      <P dim>
        Tenlo todo listo:<br />
        Conexion estable, camara y audio funcionando, sitio tranquilo.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrian Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
