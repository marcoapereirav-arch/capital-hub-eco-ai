import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  product: string          // ej "IA Integrator"
  inviteUrl: string        // app.capitalhubapp.com/accept/[token]
  closerName?: string      // quién cerró la venta
}

/**
 * Email de bienvenida al alumno tras venta high-ticket.
 * Se dispara desde el formulario de venta en el OS.
 * El alumno clica "Activar mi acceso" → llega a la App, define contraseña, entra.
 *
 * Copy v1 escrito por Marco basado en estilo Adrián.
 * Marcado como pendiente de optimizar en task "Optimizar copy email alumno".
 */
export function WelcomeAlumnoHTEmail({ fullName, product, inviteUrl, closerName }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview={`${firstName}, te has comprometido. Ahora entra y empieza tu transformación.`}>
      <H1>{firstName ? `${firstName}, ` : ""}entras hoy.</H1>

      <P>
        Acabas de dar el paso más difícil. No el del pago — el de comprometerte contigo mismo y decir
        “me lo tomo en serio”. Ese es el que de verdad cambia la vida.
      </P>

      <P>
        Tu acceso a la formación de <strong>{product}</strong> ya está listo. Tienes todo
        preparado para empezar hoy mismo.
      </P>

      <Section style={{ backgroundColor: "rgba(55, 202, 55, 0.07)", border: `1px solid ${emailColors.accent}`, padding: 18, margin: "24px 0", borderRadius: 4 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 11, color: emailColors.accent, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>
          Cómo empezar
        </Text>
        <Text style={{ fontSize: 14, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.55 }}>
          1. Pulsa el botón de abajo
        </Text>
        <Text style={{ fontSize: 14, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.55 }}>
          2. Crea tu contraseña (tarda 30 segundos)
        </Text>
        <Text style={{ fontSize: 14, color: emailColors.text, margin: "0 0 6px", lineHeight: 1.55 }}>
          3. Completa tu perfil (foto, profesión, en qué vas a enfocarte)
        </Text>
        <Text style={{ fontSize: 14, color: emailColors.text, margin: 0, lineHeight: 1.55 }}>
          4. Empieza por el vídeo 1 del módulo 1. Sin saltar pasos.
        </Text>
      </Section>

      <Button href={inviteUrl}>Activar mi acceso ahora</Button>

      <P dim>
        El link es único y válido durante 7 días. Si caduca, escríbenos a este email y te
        generamos otro.
      </P>

      <Section style={{ borderTop: `1px solid ${emailColors.border}`, paddingTop: 20, marginTop: 28 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 10, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
          Reglas internas (lee esto)
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.textDim, margin: "0 0 6px", lineHeight: 1.55 }}>
          · Una formación a la vez. No saltes. El síndrome del objeto brillante es lo que te trajo
            aquí; aquí lo curamos.
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.textDim, margin: "0 0 6px", lineHeight: 1.55 }}>
          · Completa las lecciones en orden. La siguiente solo se desbloquea cuando marcas la
            anterior como hecha.
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.textDim, margin: "0 0 6px", lineHeight: 1.55 }}>
          · La comunidad está dentro de la App. Postea tus dudas allí, conecta con los demás.
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.textDim, margin: 0, lineHeight: 1.55 }}>
          · Si tienes una emergencia técnica, responde a este email.
        </Text>
      </Section>

      <P>
        Nos vemos dentro. Que no se te olvide por qué empezaste.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "28px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
      {closerName && closerName !== "Adrián" && (
        <Text style={{ fontSize: 11, color: emailColors.textDim, margin: "8px 0 0", fontStyle: "italic" }}>
          PD: Cerraste con {closerName}. Si quieres seguir hablando con él/ella, escríbenos.
        </Text>
      )}
    </EmailLayout>
  )
}
