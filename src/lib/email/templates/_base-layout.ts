const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Capital Hub OS'

export function baseLayout(opts: { preview?: string; bodyHtml: string }): string {
  const preview = opts.preview ? `<span style="display:none;opacity:0">${opts.preview}</span>` : ''
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;background:#0F0F12;font-family:'Inter Tight',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">${preview}
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="100%" style="max-width:560px" cellpadding="0" cellspacing="0">
<tr><td style="background:#0F0F12;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;color:#FFFFFF;font-size:18px;font-weight:600;letter-spacing:-0.01em">${APP_NAME}</td></tr>
<tr><td style="background:#2A2D34;padding:32px;color:#F5F6F7">${opts.bodyHtml}</td></tr>
<tr><td style="background:#0F0F12;padding:16px 32px;border-radius:0 0 12px 12px;color:#9CA3AF;font-size:12px;text-align:center">Recibiste este correo porque tienes una cuenta en ${APP_NAME}.</td></tr>
</table></td></tr></table></body></html>`
}

export function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#FFFFFF;color:#0F0F12;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:-0.01em">${label}</a>`
}
