import { Suspense } from 'react'
import { LoginForm } from '@/features/auth/components'

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pb-safe pt-safe">
      <div className="w-full max-w-sm space-y-7 border border-border bg-card p-6 md:space-y-8 md:p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Acceder</p>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Bienvenido de vuelta</h1>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-muted-foreground">
          Acceso solo para administradores.
        </p>
      </div>
    </div>
  )
}
