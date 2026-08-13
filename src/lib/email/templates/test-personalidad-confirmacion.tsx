import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Section, Link, Text } from "@react-email/components"

interface Props {
  firstName: string
  /**
   * URL del endpoint de acceso, NO el link directo a Equilibria.
   * Igual que en la landing: abrir el test desde aquí también marca al contacto como
   * Lead cualificado y alimenta a Meta. Con el link directo se perdería esa señal.
   */
  accessUrl: string
  /** Link wa.me con el mensaje ya escrito. Mismo destino que el botón de la landing. */
  whatsappUrl: string
  /** Perfil de Instagram de Adrián. Mismo destino que el botón de la landing. */
  instagramUrl: string
}

/**
 * Email de confirmación del funnel del test (v3, funnel directo).
 *
 * Sale AL INSTANTE de dejar los datos, no a los 7 minutos. No es el mismo correo que
 * `test_personalidad_acceso`, que pertenece al paso intermedio y hoy está en pausa.
 *
 * Por qué existe (Marco, 2026-08-11): en el funnel directo el lead entra al test en el
 * momento, así que técnicamente no necesita que le mandemos nada. Pero si cierra la
 * pestaña sin hacerlo, se queda sin manera de volver, y nos ha dado su correo justo para
 * eso. Este email es su copia de seguridad del acceso.
 *
 * Por eso el copy NO promete nada ni vende nada: da el enlace y se aparta. La persona ya
 * tiene el test delante cuando lo recibe; si le contamos otra vez lo que es, sobra.
 *
 * Editable y pausable desde /email-marketing (plantilla 'test_personalidad_confirmacion').
 */
export function TestPersonalidadConfirmacionEmail({
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
    <EmailLayout preview="Tu acceso al test, por si lo quieres hacer más tarde.">
      <H1>Este es tu acceso al test{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Lo acabas de abrir en la web. Te lo dejo también aquí por si prefieres hacerlo más
        tarde o desde otro dispositivo.
      </P>

      <Button href={accessUrl}>Abrir el test</Button>

      <P>
        Son <strong>15 minutos</strong>. Al terminar verás tu resultado en cuatro colores, con
        tus fortalezas y lo que te frena.
      </P>

      <P>
        Cuando lo tengas, hazle una <strong>captura de pantalla</strong> y envíanosla por aquí.
        Te lo leemos y te decimos qué profesión digital encaja con tu perfil.
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

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>
        Adrián Villanueva
      </Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>
        Fundador, Capital Hub
      </Text>
    </EmailLayout>
  )
}
