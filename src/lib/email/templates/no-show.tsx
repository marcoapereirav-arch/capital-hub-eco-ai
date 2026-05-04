import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  fullName: string
  agendaUrl: string
}

export function NoShowEmail({ fullName, agendaUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview="No te pude ver hoy. Te dejo el link para reagendar — tienes hueco esta semana">
      <H1>No te vi hoy{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Estuve en la llamada esperando pero no pudimos hablar. No pasa nada, te entiendo —{" "}
        un imprevisto puede surgir en cualquier momento.
      </P>
      <P>
        Lo que <strong style={{ color: emailColors.text }}>no te puedo dar</strong> es la versión "te llamo dentro de 6 meses".
        Tu prueba sigue corriendo y queda menos tiempo para que aproveches el plan personalizado que hablaríamos en la llamada.
      </P>

      <Button href={agendaUrl}>Reagendar mi llamada (1 click)</Button>

      <P dim>Si finalmente no quieres seguir, también vale — responde a este email y lo gestionamos.</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
