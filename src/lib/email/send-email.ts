import "server-only"
import { createClient } from "@supabase/supabase-js"
import { getResendClient, RESEND_FROM } from "./resend-client"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type SendEmailInput = {
  template: string
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  leadId?: string
  callId?: string
  metadata?: Record<string, unknown>
  attachments?: { filename: string; content: string; contentType?: string }[]
  /**
   * Variables disponibles para placeholder substitution {{key}} cuando hay
   * override del template en email_template_overrides. Ej: { firstName: 'Marco',
   * inviteUrl: 'https://...' }. Si no hay override, se ignora.
   */
  vars?: Record<string, string | number>
}

/**
 * Reemplaza {{key}} por su valor en text/html. Si la variable no existe
 * en vars, se deja el {{key}} tal cual (útil para depurar overrides incompletos).
 */
function substituteVars(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const v = vars[key]
    return v != null ? String(v) : match
  })
}

/**
 * Envía un email via Resend + persiste log en Supabase email_logs.
 * Si Resend falla, registra el error pero NO lanza (el flow upstream sigue).
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; resendId?: string; error?: string }> {
  const resend = getResendClient()
  const supabase = getAdminClient()

  let resendId: string | undefined
  let error: string | undefined
  let status: "sent" | "failed" = "sent"

  // Override: si super_admin guardó un texto custom para este template_key,
  // lo usa en lugar del HTML/subject hardcoded del template React.
  let finalSubject = input.subject
  let finalHtml = input.html
  let overrideUsed = false
  try {
    const { data: override } = await supabase
      .from("email_template_overrides")
      .select("subject, html_body")
      .eq("template_key", input.template)
      .maybeSingle()
    if (override) {
      const vars = input.vars ?? {}
      finalSubject = substituteVars(override.subject as string, vars)
      finalHtml = substituteVars(override.html_body as string, vars)
      overrideUsed = true
    }
  } catch {
    // Si la tabla no existe en local/staging, sigue con el default.
  }

  try {
    const { data, error: sendError } = await resend.emails.send({
      from: RESEND_FROM,
      to: input.toName ? [`${input.toName} <${input.to}>`] : [input.to],
      subject: finalSubject,
      html: finalHtml,
      text: input.text,
      tags: [
        { name: "template", value: input.template },
        ...(overrideUsed ? [{ name: "override", value: "1" }] : []),
      ],
      ...(input.attachments && input.attachments.length > 0 && {
        attachments: input.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      }),
    })

    if (sendError) {
      status = "failed"
      error = sendError.message
    } else if (data?.id) {
      resendId = data.id
    }
  } catch (e) {
    status = "failed"
    error = e instanceof Error ? e.message : "unknown error"
  }

  await supabase.from("email_logs").insert({
    template: input.template,
    to_email: input.to.toLowerCase().trim(),
    to_name: input.toName ?? null,
    subject: finalSubject,
    resend_id: resendId ?? null,
    status,
    error: error ?? null,
    metadata: { ...(input.metadata ?? {}), override_used: overrideUsed },
    lead_id: input.leadId ?? null,
    call_id: input.callId ?? null,
  })

  return { ok: status === "sent", resendId, error }
}
