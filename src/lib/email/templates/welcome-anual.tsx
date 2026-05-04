import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  appUrl?: string
  agendaUrl: string
}

export function WelcomeAnualEmail({ fullName, appUrl, agendaUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview="Plan anual activado · acceso premium ya disponible · agenda tu sesión 1:1 de onboarding">
      <H1>Gracias{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Tu plan anual de Capital Hub está activo. Has elegido el camino más comprometido — y eso suele predecir los mejores resultados.
      </P>

      <Section style={{ backgroundColor: "rgba(55, 202, 55, 0.06)", border: `1px solid ${emailColors.accent}`, padding: 16, margin: "20px 0", borderRadius: 4 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 11, color: emailColors.accent, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>
          Tu plan anual incluye
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          ✓ Todo lo del plan mensual (formación + bolsa empleo + comunidad)
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          ✓ Sesión 1:1 de onboarding personalizada (reserva abajo)
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          ✓ Acceso anticipado a las nuevas masterclasses
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          ✓ Plantillas premium de portfolio
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: 0, lineHeight: 1.5 }}>
          ✓ Garantía de devolución 30 días
        </Text>
      </Section>

      <Button href={agendaUrl}>Reservar mi sesión 1:1 de onboarding</Button>

      {appUrl && (
        <P dim>
          Tu acceso a la plataforma:{" "}
          <a href={appUrl} style={{ color: emailColors.text }}>{appUrl}</a>
        </P>
      )}

      <P dim>Si tienes cualquier duda, responde a este email. Lo leo personalmente.</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
