import { baseLayout, button } from './_base-layout'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Capital Hub OS'

export function renderPasswordResetEmail(opts: { resetLink: string }): { subject: string; html: string; text: string } {
  const html = baseLayout({
    preview: 'Restablece tu contraseña',
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;letter-spacing:-0.02em;color:#FFFFFF">Restablece tu contraseña</h1>
      <p style="color:#D1D5DB;font-size:15px;line-height:1.6;margin:0 0 24px">Pulsa el botón para crear una nueva contraseña. El enlace caduca en 24 horas y solo funciona una vez.</p>
      <div style="text-align:center;margin:32px 0">${button(opts.resetLink, 'Crear nueva contraseña')}</div>
      <p style="color:#9CA3AF;font-size:13px;line-height:1.5">Si no pediste esto, ignora este correo. Tu contraseña no cambiará.</p>`,
  })
  return { subject: 'Restablece tu contraseña', html, text: `Restablece tu contraseña en ${APP_NAME}: ${opts.resetLink} (caduca en 24h, un solo uso).` }
}
