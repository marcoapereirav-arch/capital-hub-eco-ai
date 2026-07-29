import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  firstName: string
  whatsappUrl: string
  dateLabel: string
}

/**
 * Email de confirmación del opt-in del webinar. Se envía cuando un lead reserva su
 * plaza en /webinar. Flujo vigente (2026-07-28): para conseguir la entrada, el lead
 * escribe por WhatsApp a Adrián (mismo paso que la página de gracias). El botón abre
 * WhatsApp con el mensaje ya escrito. Copy al grano, español neutro, sin em dash.
 * Editable desde /email-marketing (template 'optin_webinar').
 */
export function WebinarOptinEmail({ firstName, whatsappUrl, dateLabel }: Props) {
  return (
    <EmailLayout preview="Tu plaza está reservada. Escríbenos por WhatsApp para conseguir tu entrada.">
      <H1>Tu plaza está reservada{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        El directo es <strong>{dateLabel}</strong>. Para conseguir tu entrada, escríbenos por
        WhatsApp. Te respondemos con el acceso.
      </P>

      <Button href={whatsappUrl}>Conseguir mi entrada por WhatsApp</Button>

      <P dim>Si el botón no funciona, copia y pega este enlace: {whatsappUrl}</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
