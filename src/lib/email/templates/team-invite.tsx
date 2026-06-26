import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  fullName: string
  invitedByName: string
  role: string
  acceptUrl: string
  expiresIn: string  // ej "7 días"
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  closer: "Closer",
  formador: "Formador",
  equipo: "Equipo",
}

export function TeamInviteEmail({ fullName, invitedByName, role, acceptUrl, expiresIn }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  return (
    <EmailLayout preview={`${invitedByName} te invita al OS de Capital Hub`}>
      <H1>Hola{firstName ? `, ${firstName}` : ""}.</H1>

      <P>
        <strong>{invitedByName}</strong> te ha invitado a unirte al sistema operativo interno
        de <strong>Capital Hub</strong>.
      </P>

      <Section style={{ backgroundColor: emailColors.surface, border: `1px solid ${emailColors.border}`, padding: 16, margin: "20px 0", borderRadius: 4 }}>
        <Text style={{ fontFamily: "monospace", fontSize: 11, color: emailColors.textDim, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>
          Tu rol
        </Text>
        <Text style={{ fontSize: 16, color: emailColors.text, fontWeight: 600, margin: 0 }}>
          {ROLE_LABELS[role] ?? role}
        </Text>
      </Section>

      <P>
        Pulsa el botón para configurar tu contraseña y acceder al sistema.
      </P>

      <Button href={acceptUrl}>Configurar mi contraseña</Button>

      <P dim>
        Este enlace caduca en <strong>{expiresIn}</strong>. Si caduca, pídele a {invitedByName} que te envíe uno nuevo.
      </P>

      <P dim>Si no esperabas esta invitación, ignora este email.</P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Equipo Capital Hub</Text>
    </EmailLayout>
  )
}
