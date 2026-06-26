const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Capital Hub OS'

/**
 * Layout base de los emails token-based (reset, confirmación, cambio de email).
 * Brandkit Capital Hub — monocromo matte, limpio, SIN caja gris pesada:
 * fondo #0F0F12, texto directo sobre el fondo con separadores finos, eyebrow
 * "CAPITAL HUB" y botón blanco. Mismo lenguaje visual que el resto de plantillas.
 */

const C = {
  bg: '#0F0F12',
  text: '#FAFAFA',
  body: '#D1D5DB',
  dim: '#9CA3AF',
  muted: '#6B7280',
  border: '#2A2D34',
  surface: '#18181B',
  white: '#FFFFFF',
}
const FONT = "-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const MONO = "ui-monospace,'JetBrains Mono',Menlo,Consolas,monospace"

export function baseLayout(opts: { preview?: string; bodyHtml: string }): string {
  const preview = opts.preview
    ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${opts.preview}</span>`
    : ''
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="format-detection" content="telephone=no,date=no,address=no,email=no"/></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};-webkit-font-smoothing:antialiased">${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:44px 24px">
<table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">
  <tr><td style="padding:0 0 30px;text-align:center"><span style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:${C.muted};font-weight:600">Capital&nbsp;Hub</span></td></tr>
  <tr><td style="color:${C.body};font-size:15px;line-height:1.65">${opts.bodyHtml}</td></tr>
  <tr><td style="padding:30px 0 0">
    <div style="height:1px;line-height:1px;font-size:0;background:${C.border}">&nbsp;</div>
    <p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:${C.muted}">Capital Hub · Adrián Villanueva · ecoai.capitalhubapp.com</p>
    <p style="margin:6px 0 0;font-size:11px;line-height:1.6;color:${C.muted}">Recibiste este correo porque tienes una cuenta en ${APP_NAME}.</p>
  </td></tr>
</table></td></tr></table></body></html>`
}

/** Encabezado h1 brandkit. */
export function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:${C.text};line-height:1.25">${text}</h1>`
}

/** Párrafo de cuerpo. `dim` para texto secundario. */
export function p(text: string, dim = false): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${dim ? C.dim : C.body}">${text}</p>`
}

/**
 * Muestra un email como "chip" monoespaciado. Va envuelto en <a mailto> a
 * propósito: así Gmail/clientes NO lo recolorean de azul (no re-enlazan texto
 * que ya es un <a>), y aplicamos el color del brandkit.
 */
export function emailChip(email: string): string {
  return `<a href="mailto:${email}" style="font-family:${MONO};font-size:13px;color:${C.text};text-decoration:none;background:${C.surface};border:1px solid ${C.border};border-radius:4px;padding:3px 8px;white-space:nowrap;display:inline-block">${email}</a>`
}

/** Botón blanco (accent del brandkit). */
export function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${C.white};color:${C.bg};padding:13px 30px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0">${label}</a>`
}

/** Botón centrado con su margen. */
export function buttonBlock(href: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0">${button(href, label)}</div>`
}
