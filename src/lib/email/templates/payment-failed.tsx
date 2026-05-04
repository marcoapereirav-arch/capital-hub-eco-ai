import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  fullName: string
  updateCardUrl: string
}

export function PaymentFailedEmail({ fullName, updateCardUrl }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview="Hubo un problema con el cobro de tu suscripción a Capital Hub. Actualiza tu método de pago.">
      <H1>Problema con tu pago{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Hemos intentado cobrar la cuota de tu membresía y el banco ha rechazado el pago. Suele pasar por una tarjeta caducada, fondos insuficientes o el banco bloqueando un cobro internacional.
      </P>
      <P>
        Si no actualizas el método de pago en los próximos <strong style={{ color: emailColors.text }}>3 días</strong>, perderás el acceso a Capital Hub.
      </P>

      <Button href={updateCardUrl}>Actualizar mi método de pago</Button>

      <P dim>
        Si crees que es un error o necesitas ayuda con tu banco, responde a este email cuanto antes.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
