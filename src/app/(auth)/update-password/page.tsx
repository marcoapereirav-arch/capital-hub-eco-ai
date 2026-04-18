import { UpdatePasswordForm } from '@/features/auth/components'

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-8 border border-border bg-card p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Nueva contraseña</p>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Define tu contraseña</h1>
        </div>

        <UpdatePasswordForm />
      </div>
    </div>
  )
}
