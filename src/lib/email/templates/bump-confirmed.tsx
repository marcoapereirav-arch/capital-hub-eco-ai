import * as React from "react"
import { EmailLayout, H1, P, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  appUrl?: string
}

export function BumpConfirmedEmail({ fullName, appUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview="✓ Bonus Bundle Express activado · acceso a las 3 masterclasses VIP, plantilla CV remoto y plan acelerado 7d">
      <H1>Bonus activado{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Acabas de añadir el <strong style={{ color: emailColors.text }}>Bonus Bundle Express</strong> a tu prueba — buena decisión: vas a empezar con bastante más herramientas en mano.
      </P>

      <Section style={{ backgroundColor: emailColors.bg, border: `1px solid ${emailColors.border}`, padding: 16, margin: "20px 0", borderRadius: 4 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 11, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>
          Lo que tienes desde YA
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          ✓ 3 masterclasses VIP (no en el catálogo público)
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          ✓ Plantilla CV optimizada para trabajo remoto
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.5 }}>
          ✓ Plan personalizado acelerado de 7 días
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.text, margin: 0, lineHeight: 1.5 }}>
          ✓ Acceso a la sesión Q&amp;A semanal
        </Text>
      </Section>

      {appUrl && (
        <P>
          Entra a la plataforma y verás los bonus desbloqueados en tu cuenta:{" "}
          <a href={appUrl} style={{ color: emailColors.text }}>{appUrl}</a>
        </P>
      )}

      <P dim>Cobro único de 19€ ya realizado — independiente del free trial. No hay suscripción asociada al bonus.</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
