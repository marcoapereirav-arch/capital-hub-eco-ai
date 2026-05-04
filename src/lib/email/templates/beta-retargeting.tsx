import * as React from "react"
import { EmailLayout, H1, P, Button, emailColors } from "./_layout"
import { Text } from "@react-email/components"

interface Props {
  fullName: string
  rejoinUrl: string
  cancelOrigin: "trial" | "monthly" | "annual"
}

const COPY: Record<Props["cancelOrigin"], { preview: string; title: string; body: React.ReactNode }> = {
  trial: {
    preview: "Cancelaste durante la prueba — ¿qué te frenó? Cuéntanoslo o vuelve cuando quieras",
    title: "Lamento verte irte.",
    body: (
      <>
        Cancelaste durante la prueba gratuita. No te juzgo — quizás no era el momento, o algo no encajó como esperabas.
        Si tienes 2 minutos, responde a este email y dime qué te frenó. Me ayuda a mejorar el producto para los próximos.
      </>
    ),
  },
  monthly: {
    preview: "Cancelaste tu suscripción mensual — la puerta queda abierta",
    title: "Hasta luego.",
    body: (
      <>
        Cancelaste tu suscripción mensual. Gracias por haber estado todo este tiempo con nosotros. Si en algún momento
        quieres volver, tu cuenta y tu progreso siguen ahí — solo tienes que reactivar.
      </>
    ),
  },
  annual: {
    preview: "Tu plan anual no se renovó — la puerta queda abierta",
    title: "Hasta la próxima.",
    body: (
      <>
        Tu plan anual ha llegado a su fin y no se ha renovado. Si te ha servido, lo mejor que puedes hacer es seguir
        aplicando lo aprendido. Si en algún momento quieres volver para refresh o nueva formación, aquí seguimos.
      </>
    ),
  },
}

export function BetaRetargetingEmail({ fullName, rejoinUrl, cancelOrigin }: Props) {
  const firstName = fullName.split(" ")[0] || ""
  const c = COPY[cancelOrigin]
  return (
    <EmailLayout preview={c.preview}>
      <H1>{c.title}{firstName ? ` ${firstName}.` : ""}</H1>
      <P>{c.body}</P>

      <Button href={rejoinUrl}>Volver a Capital Hub</Button>

      <P dim>
        No te enviaré más emails sobre esto a no ser que tú nos contactes. Si quieres ser borrado de nuestra base
        de datos, responde con la palabra "BORRAR" y lo gestionamos en 24h.
      </P>

      <Text style={{ fontSize: 14, color: emailColors.text, margin: "24px 0 4px" }}>Adrián Villanueva</Text>
      <Text style={{ fontSize: 12, color: emailColors.textDim, margin: 0 }}>Fundador, Capital Hub</Text>
    </EmailLayout>
  )
}
