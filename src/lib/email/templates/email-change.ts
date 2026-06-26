import { baseLayout, h1, p, buttonBlock, emailChip } from './_base-layout'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Capital Hub OS'

export function renderEmailChangeEmail(opts: { confirmLink: string; newEmail: string }): { subject: string; html: string; text: string } {
  const html = baseLayout({
    preview: 'Confirma tu nuevo email',
    bodyHtml: `
      ${h1('Confirma tu nuevo email')}
      ${p(`Se pidió cambiar el email de esta cuenta a ${emailChip(opts.newEmail)}.`)}
      ${p('Pulsa el botón para confirmarlo. El enlace caduca en 24 horas.')}
      ${buttonBlock(opts.confirmLink, 'Confirmar nuevo email')}
      ${p('Si no pediste esto, ignora este correo. El email no cambiará.', true)}`,
  })
  return { subject: 'Confirma tu nuevo email', html, text: `Confirma tu nuevo email en ${APP_NAME}: ${opts.confirmLink} (caduca en 24h).` }
}
