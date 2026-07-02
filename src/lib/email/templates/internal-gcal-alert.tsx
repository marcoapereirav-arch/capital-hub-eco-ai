import * as React from "react"
import { EmailLayout, H1, P, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  reason: string  // "refresh_failed", "manually_disconnected", "token_revoked", etc.
  detail?: string
  lastConnectedAt?: string | null
  ownerEmail?: string | null
}

export function InternalGCalAlert({ reason, detail, lastConnectedAt, ownerEmail }: Props) {
  const reasonHuman: Record<string, string> = {
    refresh_failed: "El refresh token no funciona. Probablemente Google lo invalidó.",
    manually_disconnected: "Alguien desconectó manualmente desde el panel.",
    token_revoked: "Los permisos fueron revocados desde la cuenta Google.",
    expired_testing_mode: "La app Google Cloud está en modo Testing — refresh tokens caducan a los 7 días.",
    unknown: "Causa no identificada. Revisar logs.",
  }

  return (
    <EmailLayout preview="⚠️ Google Calendar desconectado del OS">
      <Text style={{ fontFamily: "monospace", fontSize: 11, color: "#FF6B6B", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
        ⚠️ ALERTA · GOOGLE CALENDAR DESCONECTADO
      </Text>

      <H1>El calendario de Adrián ya no está conectado al OS.</H1>

      <P>
        Las llamadas reservadas en <code style={{ fontFamily: "monospace" }}>/agenda</code> ya
        NO se crean automáticamente en el Google Calendar de Adrián.
      </P>

      <Section style={{ backgroundColor: "rgba(255, 107, 107, 0.06)", border: "1px solid #FF6B6B", padding: 16, margin: "20px 0", borderRadius: 4 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 10, color: "#FF6B6B", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
          Causa probable
        </Text>
        <Text style={{ fontSize: 14, color: emailColors.text, margin: 0 }}>
          {reasonHuman[reason] ?? reasonHuman.unknown}
        </Text>
        {detail && (
          <Text style={{ fontSize: 12, color: emailColors.textDim, margin: "8px 0 0", fontFamily: "monospace" }}>
            Detalle: {detail}
          </Text>
        )}
      </Section>

      {ownerEmail && (
        <Section style={{ borderLeft: `2px solid ${emailColors.border}`, paddingLeft: 14, margin: "16px 0" }}>
          <Text style={{ fontFamily: "monospace", fontSize: 10, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
            Cuenta que estaba conectada
          </Text>
          <Text style={{ fontSize: 13, color: emailColors.text, margin: 0 }}>{ownerEmail}</Text>
          {lastConnectedAt && (
            <Text style={{ fontSize: 11, color: emailColors.textDim, margin: "4px 0 0", fontFamily: "monospace" }}>
              Última conexión: {new Date(lastConnectedAt).toLocaleString("es-ES")}
            </Text>
          )}
        </Section>
      )}

      <P>
        <strong>Acción inmediata:</strong> Adrián tiene que entrar a{" "}
        <a href="https://os.capitalhubapp.com/calendario" style={{ color: emailColors.text }}>
          os.capitalhubapp.com/calendario
        </a>{" "}
        → Configuración → "Conectar ahora" y reautorizar.
      </P>

      <P dim>
        Mientras tanto las llamadas SÍ aparecen en el OS y los leads reciben el email
        con la confirmación + Zoom link. Solo no se replica en el calendar Google de Adrián.
      </P>
    </EmailLayout>
  )
}
