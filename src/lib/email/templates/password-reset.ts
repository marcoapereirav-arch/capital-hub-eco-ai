import { baseLayout, h1, p, buttonBlock } from './_base-layout'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Capital Hub OS'

export function renderPasswordResetEmail(opts: { resetLink: string }): { subject: string; html: string; text: string } {
  const html = baseLayout({
    preview: 'Restablece tu contraseña',
    bodyHtml: `
      ${h1('Restablece tu contraseña')}
      ${p('Pulsa el botón para crear una nueva contraseña. El enlace caduca en 24 horas y solo funciona una vez.')}
      ${buttonBlock(opts.resetLink, 'Crear nueva contraseña')}
      ${p('Si no pediste esto, ignora este correo. Tu contraseña no cambiará.', true)}`,
  })
  return { subject: 'Restablece tu contraseña', html, text: `Restablece tu contraseña en ${APP_NAME}: ${opts.resetLink} (caduca en 24h, un solo uso).` }
}
