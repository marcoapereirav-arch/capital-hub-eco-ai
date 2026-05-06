import Link from "next/link"
import { AlertTriangle } from "lucide-react"

type Reason = "missing_token" | "invalid_token" | "slug_mismatch" | "inactive"

const MESSAGES: Record<Reason, { title: string; body: string }> = {
  missing_token: {
    title: "Este enlace no es válido",
    body: "Falta el token de acceso. Vuelve a tu DM de Instagram y abre el enlace original que te enviamos.",
  },
  invalid_token: {
    title: "Este enlace ya no funciona",
    body: "El token ha expirado o no es válido. Vuelve a comentar la palabra clave en el Reel para recibir un enlace nuevo.",
  },
  slug_mismatch: {
    title: "Recurso incorrecto",
    body: "El enlace apunta a un recurso distinto al que tenías acceso. Vuelve a comentar la palabra clave en el Reel correspondiente.",
  },
  inactive: {
    title: "Recurso temporalmente no disponible",
    body: "Este recurso se ha pausado. Si crees que es un error, escríbenos por DM.",
  },
}

export function LmInvalid({ reason }: { reason: Reason }) {
  const msg = MESSAGES[reason]
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="mx-auto w-full max-w-md">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {msg.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{msg.body}</p>

        <div className="mt-10">
          <Link
            href="https://www.instagram.com/capitalhub.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Ir a Instagram
          </Link>
        </div>
      </div>
    </main>
  )
}
