import * as React from "react"
import { EmailLayout, H1, P, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  slotStartIso: string
  meetingUrl?: string | null
  cancelUrl?: string | null
  rescheduleUrl?: string | null
  /** Duracion real del slot en minutos. Se obtiene del event_type real (Calendly) o del calendar propio. */
  durationMinutes?: number
}

/**
 * Email de confirmacion al lead que reservo la llamada.
 * Copy sin em-dash. Duracion NO esta hardcoded a 20 min, viene del slot real.
 */
export function AgendaConfirmedEmail({ fullName, slotStartIso, meetingUrl, cancelUrl, rescheduleUrl, durationMinutes }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  const date = new Date(slotStartIso)
  const dateStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const durStr = durationMinutes && durationMinutes > 0 ? ` (${durationMinutes} min)` : ""

  return (
    <EmailLayout preview={`Confirmada tu llamada el ${dateStr} a las ${timeStr}.`}>
      <H1>Confirmada{firstName ? `, ${firstName}` : ""}.</H1>
      <P>
        Tu llamada conmigo esta reservada. Te dejo los detalles:
      </P>

      <Section style={{ backgroundColor: emailColors.surface, border: `1px solid ${emailColors.border}`, padding: 18, margin: "20px 0", borderRadius: 4 }}>
        <Text style={{ fontSize: 12, color: emailColors.textDim, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>
          Tu cita
        </Text>
        <Text style={{ fontSize: 18, color: emailColors.text, fontWeight: 600, margin: "0 0 4px", textTransform: "capitalize" }}>
          {dateStr}
        </Text>
        <Text style={{ fontSize: 16, color: emailColors.text, margin: 0 }}>
          {timeStr} (hora Espana){durStr}
        </Text>
        {meetingUrl && (
          <Text style={{ fontSize: 13, color: emailColors.textDim, margin: "12px 0 0" }}>
            Link de la llamada:{" "}
            <a href={meetingUrl} style={{ color: emailColors.text }}>{meetingUrl}</a>
          </Text>
        )}
      </Section>

      <Text style={{ fontSize: 14, color: emailColors.textDim, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "24px 0 12px" }}>
        Como prepararte
      </Text>
      <P dim>
        Camara y audio en sitio tranquilo.<br />
        Libreta o notas para apuntar.<br />
        Piensa: que situacion profesional quieres cambiar.<br />
        2 o 3 dudas concretas que tengas.
      </P>

      {(rescheduleUrl || cancelUrl) ? (
        <P dim>
          Si necesitas cambios:{" "}
          {rescheduleUrl && (
            <>
              <a href={rescheduleUrl} style={{ color: emailColors.text }}>Reagendar</a>
              {cancelUrl && " . "}
            </>
          )}
          {cancelUrl && (
            <a href={cancelUrl} style={{ color: emailColors.text }}>Cancelar</a>
          )}
        </P>
      ) : (
        <P dim>
          Si necesitas reagendar, responde a este email.
        </P>
      )}

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrian Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
