import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  appUrl?: string
  agendaUrl: string
}

export function WelcomeTrialEmail({ fullName, appUrl, agendaUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview="Tu prueba gratuita de 14 días está activa. Próximo paso: agendar tu llamada con Adrián.">
      <H1>Bienvenido{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Acaba de activarse tu prueba gratuita de 14 días en Capital Hub. Hoy no se te ha cobrado nada.
        El día 15, si no cancelas, se activa tu membresía a 97€/mes.
      </P>

      <Section style={{ borderLeft: `2px solid ${emailColors.accent}`, paddingLeft: 14, margin: "20px 0" }}>
        <Text style={{ fontSize: 13, color: emailColors.textDim, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          PASO 1 — Agenda tu llamada de diagnóstico
        </Text>
        <Text style={{ fontSize: 14, color: emailColors.text, margin: 0, lineHeight: 1.5 }}>
          20 minutos contigo y conmigo (Adrián). Definimos qué profesión digital encaja contigo, qué formación necesitas y cómo conseguir tu primer trabajo.
        </Text>
      </Section>

      <Button href={agendaUrl}>Agendar mi llamada ahora</Button>

      {appUrl && (
        <P dim>
          Tu acceso a la plataforma:{" "}
          <a href={appUrl} style={{ color: emailColors.text }}>{appUrl}</a>
        </P>
      )}

      <P dim>
        Si tienes cualquier duda, responde a este email. Lo leo yo personalmente.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
