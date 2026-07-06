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
 * plaza en /webinar. Único objetivo: que entre al grupo de WhatsApp (donde se suelta
 * el link del Zoom). Copy directo, sin em-dash, sin promesas inventadas.
 * El copy es editable desde /email-marketing (template 'optin_webinar').
 */
export function WebinarOptinEmail({ firstName, whatsappUrl, dateLabel }: Props) {
  return (
    <EmailLayout preview="Tu plaza en el webinar está reservada. Entra al grupo de WhatsApp.">
      <H1>Tu plaza está reservada{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        El webinar es <strong>{dateLabel}</strong>. Falta un último paso: entra al grupo de
        WhatsApp. Ahí soltamos el link del Zoom del directo y todos los avisos para que no te
        lo pierdas.
      </P>

      <Button href={whatsappUrl}>Entrar al grupo de WhatsApp</Button>

      <P dim>Si el botón no funciona, copia y pega este enlace en tu navegador: {whatsappUrl}</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
