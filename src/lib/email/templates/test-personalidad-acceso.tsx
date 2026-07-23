import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  firstName: string
  /** URL del endpoint de acceso, NO el link directo a Equilibria. Es lo que califica al lead. */
  accessUrl: string
}

/**
 * Email de entrega del test de personalidad (funnel v2, ver PRP-007).
 *
 * Se programa en el opt-in y llega a los 7 minutos, justo cuando el lead termina de
 * ver la VSL en la página de gracias. Es la promesa a cambio de sus datos, así que se
 * envía siempre, haya agendado o no.
 *
 * IMPORTANTE: el botón apunta a /api/funnel/test-personalidad/acceso, no a Equilibria.
 * Ese paso intermedio es el que marca al contacto como Lead cualificado en el CRM y
 * alimenta a Meta. Si se cambia el destino por el link directo, se pierde la medición.
 *
 * El copy es editable y pausable desde /email-marketing (template 'test_personalidad_acceso').
 */
export function TestPersonalidadAccesoEmail({ firstName, accessUrl }: Props) {
  return (
    <EmailLayout preview="Aquí tienes tu acceso al test de personalidad. Son 15 minutos.">
      <H1>Aquí tienes tu test{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Son <strong>15 minutos</strong>. Al terminar verás tu resultado en cuatro colores, con tus
        fortalezas y lo que te frena.
      </P>

      <Button href={accessUrl}>Acceder a mi test</Button>

      <P>
        Cuando lo termines, hazle una <strong>captura de pantalla</strong> y envíanosla. Te lo
        leemos y te decimos qué profesión digital encaja de verdad con tu perfil.
      </P>

      <P dim>Si el botón no funciona, copia y pega este enlace en tu navegador: {accessUrl}</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
