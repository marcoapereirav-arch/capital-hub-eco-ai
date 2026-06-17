import { baseLayout, button } from './_base-layout'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Capital Hub OS'

export function renderEmailConfirmationEmail(opts: { confirmLink: string }): { subject: string; html: string; text: string } {
  const html = baseLayout({
    preview: 'Confirma tu cuenta',
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;letter-spacing:-0.02em;color:#FFFFFF">Confirma tu cuenta</h1>
      <p style="color:#D1D5DB;font-size:15px;line-height:1.6;margin:0 0 24px">Pulsa el botón para activar tu cuenta. El enlace caduca en 24 horas.</p>
      <div style="text-align:center;margin:32px 0">${button(opts.confirmLink, 'Confirmar mi cuenta')}</div>`,
  })
  return { subject: `Confirma tu cuenta en ${APP_NAME}`, html, text: `Confirma tu cuenta en ${APP_NAME}: ${opts.confirmLink}` }
}
