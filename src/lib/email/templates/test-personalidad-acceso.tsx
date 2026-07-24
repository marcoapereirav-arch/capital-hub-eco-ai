import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Section, Link, Text } from "@react-email/components"

interface Props {
  firstName: string
  /** URL del endpoint de acceso, NO el link directo a Equilibria. Es lo que califica al lead. */
  accessUrl: string
  /** Link wa.me con el mensaje ya escrito. Mismo destino que el botón de la landing del test. */
  whatsappUrl: string
  /** Perfil de Instagram de Adrián. Mismo destino que el botón de la landing del test. */
  instagramUrl: string
}

/**
 * Email de entrega del test de personalidad (funnel v2, ver PRP-007).
 *
 * Se programa en el opt-in y llega a los 7 minutos, justo cuando el lead termina de
 * ver la VSL en la página de gracias. Es la promesa a cambio de sus datos, así que se
 * envía siempre, haya agendado o no.
 *
 * IMPORTANTE: el botón principal apunta a /api/funnel/test-personalidad/acceso, no a
 * Equilibria. Ese paso intermedio es el que marca al contacto como Lead cualificado en
 * el CRM y alimenta a Meta. Si se cambia el destino por el link directo, se pierde la
 * medición entera del funnel.
 *
 * Los botones de WhatsApp e Instagram están duplicados aquí a propósito (Marco,
 * 2026-07-23): el lead tiene el canal de contacto a mano aunque nunca llegue a abrir
 * la landing del test. Son exactamente los mismos destinos que los de esa landing.
 *
 * El copy es editable y pausable desde /email-marketing (template 'test_personalidad_acceso').
 */
export function TestPersonalidadAccesoEmail({
  firstName,
  accessUrl,
  whatsappUrl,
  instagramUrl,
}: Props) {
  const secondaryButton: React.CSSProperties = {
    display: "block",
    border: `1px solid ${emailColors.border}`,
    borderRadius: 6,
    color: emailColors.text,
    fontSize: 14,
    fontWeight: 600,
    padding: "12px 18px",
    textAlign: "center",
    textDecoration: "none",
  }

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

      <Section style={{ margin: "0 0 10px" }}>
        <Link href={instagramUrl} style={{ ...secondaryButton, marginBottom: 10 }}>
          Enviar mi resultado por Instagram
        </Link>
        <Link href={whatsappUrl} style={secondaryButton}>
          O por WhatsApp de Adrián
        </Link>
      </Section>

      <P dim>Si el botón no funciona, copia y pega este enlace en tu navegador: {accessUrl}</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
