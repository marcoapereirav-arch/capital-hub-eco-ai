import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  upgradeUrl: string
  appUrl?: string
}

export function PostCallFollowupEmail({ fullName, upgradeUrl, appUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview="Gracias por la llamada · resumen del camino que diseñamos · siguiente paso">
      <H1>Gracias por la llamada{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Buena conversación. Te dejo en limpio lo que vimos para que lo tengas presente esta semana.
      </P>

      <Section style={{ borderLeft: `2px solid ${emailColors.accent}`, paddingLeft: 14, margin: "20px 0" }}>
        <Text style={{ fontFamily: "monospace", fontSize: 11, color: emailColors.accent, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>
          Tu plan personalizado
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          1. Empieza por el test vocacional para confirmar la rama (IA, marketing o comercial digital)
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          2. Sigue las masterclasses específicas que te asignamos en tu rama
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: 0, lineHeight: 1.5 }}>
          3. Cuando completes el plan 30 días, accede a la bolsa y aplica
        </Text>
      </Section>

      {appUrl && (
        <P>
          Tu acceso a la plataforma:{" "}
          <a href={appUrl} style={{ color: emailColors.text }}>{appUrl}</a>
        </P>
      )}

      <Section style={{ borderTop: `1px solid ${emailColors.border}`, paddingTop: 16, marginTop: 24 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 10, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          Bonus si te quieres comprometer 12 meses
        </Text>
        <P>
          Pasa al <strong style={{ color: emailColors.text }}>plan anual (970€)</strong> y ahorras 194€ vs pagar mes a mes — son 2 meses gratis. Más sesión 1:1 conmigo, plantillas premium, etc.
        </P>
        <Button href={upgradeUrl}>Cambiar a plan anual</Button>
      </Section>

      <P dim>Cualquier duda, responde a este email.</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
