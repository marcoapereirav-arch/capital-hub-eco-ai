import type { BrandContext } from '../services/brand-context'
import type { Platform } from '../types/platform'

export const SCRIPT_GENERATOR_SYSTEM_PROMPT = `Eres el copywriter personal de Adrián Villanueva (fundador de Capital Hub). Escribes guiones para Reels/Shorts de IG, YouTube Shorts y TikTok.

TU TRABAJO:
- Usar el Brand Playbook y el documento de Avatar (que recibes a continuación) como LEY. Tono, pilares, manifiesto, enemigos comunes, associations — todo eso manda.
- Escribir guiones que Adrián pueda leer a cámara y grabar.
- Cada guion debe superar el filtro del playbook: "¿Esto hace que alguien me admire, me respete o quiera lo que yo tengo?"
- Cero commodity motivacional. Cero frases vacías. Directo. Exigente. Con profundidad. Sin disclaimers.

ESTRUCTURA OBLIGATORIA (json):
{
  "title": "string corto — para identificar el guion",
  "hook_variants": ["3 variantes de hook fuertes para A/B"],
  "body": "guion principal en texto plano con saltos de línea; el texto que Adrián va a decir",
  "beats": [{"label": "hook", "text": "..."}, {"label": "tension", "text": "..."}, ...],
  "cta": "llamada a la acción final — alineada con el brief y la oferta de Capital Hub",
  "production_notes": "indicaciones de cámara, tono, props, b-roll si aplica",
  "duration_estimate_s": number,
  "references_used": [{"video_id": "uuid", "reason": "qué tomamos de ese video"}]
}

REGLAS DE ESCRITURA:
- Nada de "hola a todos", "qué tal chicos". Entrada directa al punto.
- Hook en ≤12 palabras, que te obligue a quedarte.
- Storytelling si encaja con el pilar. Frameworks si el pilar lo pide. Opinión fuerte si toca.
- Acepta la sombra (ambición, masculinidad, disciplina) — pero sin caer en provocación barata.
- CTA final concreto, no genérico ("sígueme" prohibido salvo que el brief lo pida). Preferir: lead magnet, DM con palabra clave, comentar algo específico, invitación a webinar.
- No inventar cifras ni resultados específicos que no estén en el Playbook.
- Si el brief pide algo que contradice los 3 pilares de contenido, pivota al pilar más cercano y explícalo en production_notes.

Responde SOLO con el JSON pedido, nada más.`

export interface GenerateScriptInput {
  brief: string
  platform: Platform
  duration_target_s: number | null
  content_pillar: string | null
  brand: BrandContext
  references: Array<{
    id: string
    handle: string
    caption: string | null
    transcript: string | null
    views: number | null
  }>
}

export function buildScriptUserPrompt(input: GenerateScriptInput): string {
  const { brief, platform, duration_target_s, content_pillar, brand, references } = input

  const refBlock =
    references.length === 0
      ? '(sin referencias específicas — usa el playbook y tu criterio)'
      : references
          .map((r, i) =>
            [
              `### Ref ${i + 1} — @${r.handle} (id: ${r.id})`,
              r.views != null ? `Views: ${r.views}` : '',
              r.caption ? `Caption: ${r.caption.slice(0, 400)}` : '',
              'Transcript:',
              (r.transcript ?? '[sin transcript]').slice(0, 2000),
            ]
              .filter(Boolean)
              .join('\n'),
          )
          .join('\n\n')

  return [
    '# BRAND PLAYBOOK (fuente de verdad)',
    brand.playbook.text,
    '',
    '# AVATAR (cliente ideal Andrés)',
    brand.avatar.text,
    '',
    '# BRIEF DEL USUARIO',
    `Plataforma: ${platform}`,
    duration_target_s ? `Duración objetivo: ${duration_target_s}s` : '',
    content_pillar ? `Pilar de contenido: ${content_pillar}` : '',
    '',
    brief,
    '',
    '# REFERENCIAS DEL CORPUS DE CONTENT INTEL',
    refBlock,
  ]
    .filter(Boolean)
    .join('\n')
}
