'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { signUpWithEmailConfirmation } = await import('@/app/auth/signup-actions')
  const result = await signUpWithEmailConfirmation(email, password)

  if (!result.ok) {
    return { error: result.error || 'No se pudo crear la cuenta' }
  }

  redirect('/check-email')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase()
  if (!email || !/^.+@.+\..+$/.test(email)) {
    return { error: 'Email inválido' }
  }

  // Ejecuta la lógica directamente en el servidor. NO se hace fetch HTTP a la
  // propia API route: dependía de NEXT_PUBLIC_SITE_URL (vacío en local → el
  // fetch revienta y "no pasa nada") y era frágil en producción.
  try {
    const { requestPasswordReset } = await import('@/features/auth/services/request-password-reset')
    const result = await requestPasswordReset(email)
    if (!result.ok) return { error: result.error || 'No se pudo enviar el email' }
    return { success: true }
  } catch (e) {
    console.error('[resetPassword] error:', e)
    return { error: 'No se pudo enviar el email' }
  }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  // Email confirmacion via Resend (NUNCA por Supabase SMTP propio)
  if (user?.email) {
    try {
      const { sendPasswordChanged } = await import('@/lib/email/senders')
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      await sendPasswordChanged({
        email: user.email,
        fullName: profile?.full_name ?? user.email,
        changedAt: new Date(),
      })
    } catch (e) {
      console.error('[updatePassword] email confirmacion fallo:', e)
      // No bloqueamos el flujo si el email falla — la contraseña ya esta cambiada
    }
  }

  revalidatePath('/', 'layout')
  // El cliente (UpdatePasswordForm) redirige a /login?reset=ok despues del success
  return { ok: true }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: formData.get('full_name') as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
