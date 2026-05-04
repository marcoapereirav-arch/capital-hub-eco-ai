import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  cancelUrl: string
  appUrl?: string
}

export function TrialEnds48hEmail({ fullName, cancelUrl, appUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview="Tu prueba gratuita termina en 48h. Si no haces nada, se activa la membresía a 97€/mes.">
      <H1>Tu prueba termina en 48h.</H1>
      <P>
        {firstName ? `${firstName}, ` : ""}quería avisarte personalmente: dentro de 48 horas se cumple tu período de prueba gratuita de 14 días.
      </P>

      <Section style={{ backgroundColor: emailColors.bg, border: `1px solid ${emailColors.border}`, padding: 16, margin: "20px 0", borderRadius: 4 }}>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          ✓ Si te quedas: se activa la membresía a <strong>97€/mes</strong>. No tienes que hacer nada.
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: 0, lineHeight: 1.5 }}>
          ✗ Si no quieres seguir: cancela en 1 click desde tu perfil. Sin preguntas. Sin permanencia.
        </Text>
      </Section>

      {appUrl && <Button href={appUrl}>Volver a Capital Hub</Button>}

      <P dim>
        Cancelar es 1 click:{" "}
        <a href={cancelUrl} style={{ color: emailColors.textDim }}>{cancelUrl}</a>
      </P>

      <P dim>
        Si te queda alguna duda, responde a este email. Lo leo personalmente.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
