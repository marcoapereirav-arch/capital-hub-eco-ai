import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  fullName: string
  agendaUrl: string
}

/**
 * Email no-show. Copy directo, sin em-dash, sin "plan personalizado" inventado.
 * El boton lleva al link de reagendar que viene del sistema (Calendly o /agenda).
 */
export function NoShowEmail({ fullName, agendaUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview="No te pude ver hoy. Aqui tienes el link para reagendar.">
      <H1>No te vi hoy{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Estuve en la llamada esperando pero no pudimos hablar. No pasa nada, los imprevistos pasan.
      </P>
      <P>
        Si quieres, reagenda cuando te vaya bien. Te dejo el link a un click.
      </P>

      <Button href={agendaUrl}>Reagendar mi llamada</Button>

      <P dim>Si finalmente no quieres seguir, responde a este email y lo gestionamos.</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrian Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
