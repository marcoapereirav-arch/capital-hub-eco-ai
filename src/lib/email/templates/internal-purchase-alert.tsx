import * as React from "react"
import { EmailLayout, P, emailColors } from "./_layout"
import { Text, Section } from "@react-email/components"

interface Props {
  eventLabel: string // "Trial activado" / "Compra anual 970€" / "Cobro mensual 97€" / "Pago fallido" / "Cancelación"
  fullName: string
  email: string
  amount?: number
  currency?: string
  productName?: string
}

/** Email a Marco cada vez que hay actividad de pago en Whop. */
export function InternalPurchaseAlert({ eventLabel, fullName, email, amount, currency, productName }: Props) {
  const isFail = eventLabel.toLowerCase().includes("fall") || eventLabel.toLowerCase().includes("cancel")
  const accent = isFail ? "#ef4444" : emailColors.accent

  return (
    <EmailLayout preview={`💸 ${eventLabel}: ${fullName}${amount ? ` · ${amount}${currency ?? "€"}` : ""}`}>
      <Text style={{ fontFamily: "monospace", fontSize: 11, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
        {isFail ? "⚠️" : "💸"} {eventLabel}
      </Text>

      {amount != null && (
        <Section style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 14, margin: "16px 0" }}>
          <Text style={{ fontFamily: "Georgia, serif", fontSize: 32, color: emailColors.text, fontWeight: 600, margin: 0 }}>
            {amount}{currency === "EUR" ? "€" : ` ${currency ?? "EUR"}`}
          </Text>
          {productName && (
            <Text style={{ fontSize: 12, color: emailColors.textDim, margin: "2px 0 0", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {productName}
            </Text>
          )}
        </Section>
      )}

      <Section style={{ margin: "16px 0" }}>
        <Text style={{ fontSize: 15, color: emailColors.text, fontWeight: 600, margin: "0 0 4px" }}>{fullName}</Text>
        <Text style={{ fontSize: 13, color: emailColors.textDim, margin: 0 }}>
          <a href={`mailto:${email}`} style={{ color: emailColors.text }}>{email}</a>
        </Text>
      </Section>

      <P dim>Ver lead completo en el CRM: <a href="https://os.capitalhubapp.com/crm" style={{ color: emailColors.text }}>OS → CRM</a></P>
    </EmailLayout>
  )
}
