import Link from 'next/link'
import { ForgotPasswordForm } from '@/features/auth/components'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-8 border border-border bg-card p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Recuperar acceso</p>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Restablecer contraseña</h1>
        </div>

        <ForgotPasswordForm />

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}
