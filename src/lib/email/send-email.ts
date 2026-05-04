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

  try {
    const { data, error: sendError } = await resend.emails.send({
      from: RESEND_FROM,
      to: input.toName ? [`${input.toName} <${input.to}>`] : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: [{ name: "template", value: input.template }],
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
    subject: input.subject,
    resend_id: resendId ?? null,
    status,
    error: error ?? null,
    metadata: input.metadata ?? null,
    lead_id: input.leadId ?? null,
    call_id: input.callId ?? null,
  })

  return { ok: status === "sent", resendId, error }
}
