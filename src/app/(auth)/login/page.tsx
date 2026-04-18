import Link from 'next/link'
import { LoginForm } from '@/features/auth/components'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-8 border border-border bg-card p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Acceder</p>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Bienvenido de vuelta</h1>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground">
          ¿Sin cuenta?{' '}
          <Link href="/signup" className="text-foreground underline underline-offset-4">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
