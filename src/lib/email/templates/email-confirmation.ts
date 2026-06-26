import { baseLayout, h1, p, buttonBlock } from './_base-layout'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Capital Hub OS'

export function renderEmailConfirmationEmail(opts: { confirmLink: string }): { subject: string; html: string; text: string } {
  const html = baseLayout({
    preview: 'Confirma tu cuenta',
    bodyHtml: `
      ${h1('Confirma tu cuenta')}
      ${p('Pulsa el botón para activar tu cuenta. El enlace caduca en 24 horas.')}
      ${buttonBlock(opts.confirmLink, 'Confirmar mi cuenta')}`,
  })
  return { subject: `Confirma tu cuenta en ${APP_NAME}`, html, text: `Confirma tu cuenta en ${APP_NAME}: ${opts.confirmLink}` }
}
