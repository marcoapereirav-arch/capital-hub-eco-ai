import { baseLayout, button } from './_base-layout'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Capital Hub OS'

export function renderEmailChangeEmail(opts: { confirmLink: string; newEmail: string }): { subject: string; html: string; text: string } {
  const html = baseLayout({
    preview: 'Confirma tu nuevo email',
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;letter-spacing:-0.02em;color:#FFFFFF">Confirma tu nuevo email</h1>
      <p style="color:#D1D5DB;font-size:15px;line-height:1.6;margin:0 0 8px">Se pidió cambiar el email de esta cuenta a <strong style="color:#FFFFFF">${opts.newEmail}</strong>.</p>
      <p style="color:#D1D5DB;font-size:15px;line-height:1.6;margin:0 0 24px">Pulsa el botón para confirmarlo. El enlace caduca en 24 horas.</p>
      <div style="text-align:center;margin:32px 0">${button(opts.confirmLink, 'Confirmar nuevo email')}</div>
      <p style="color:#9CA3AF;font-size:13px;line-height:1.5">Si no pediste esto, ignora este correo. El email no cambiará.</p>`,
  })
  return { subject: 'Confirma tu nuevo email', html, text: `Confirma tu nuevo email en ${APP_NAME}: ${opts.confirmLink} (caduca en 24h).` }
}
