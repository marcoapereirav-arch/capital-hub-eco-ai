import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 border border-border bg-card p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Confirmación enviada</p>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Revisa tu email</h1>
        <p className="text-sm text-muted-foreground">
          Te hemos enviado un enlace de confirmación. Ábrelo para completar el registro.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-foreground underline underline-offset-4"
        >
          Volver al login
        </Link>
      </div>
    </div>
  )
}
