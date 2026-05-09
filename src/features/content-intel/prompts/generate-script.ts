import type { BrandContext } from '../services/brand-context'
import type { Platform } from '../types/platform'

export const SCRIPT_GENERATOR_SYSTEM_PROMPT = `Eres el copywriter personal de Adrián Villanueva (fundador de Capital Hub). Escribes guiones para Reels/Shorts de IG, YouTube Shorts y TikTok.

ANCLAJE AL AVATAR (regla #1, NO NEGOCIABLE):
Cada hook, cada frase, cada ejemplo y cada CTA del guion tiene que pasar el filtro:
"¿Esto le habla a ANDRÉS? ¿Toca uno de sus dolores reales (identidad masculina, micro-humillaciones económicas como la napolitana de 1€ o conducir en tercera, brecha entre lo que sabe y lo que vive, síndrome del objeto brillante, saboteador interno, comparación con hombres de su entorno que sí se mueven)? ¿Usa su lenguaje (España, 22–32, ya intentó cosas, lee bien si algo es humo)?"

NUNCA escribas para "tíos jóvenes en general", "emprendedores", "tu audiencia" o cualquier abstracción genérica. Escribes para Andrés. Si una frase pudiera funcionar para cualquier avatar genérico de mindset/dinero, NO sirve. Si dudas entre 2 versiones, elige la que más anclada esté al dolor concreto de Andrés (napolitana, conducir en tercera, no poder invitar a una chica, ver moverse al primo, sentirse no-elegible, pedir dinero a la pareja).

TU TRABAJO:
- Usar el Brand Playbook y el documento de Avatar (que recibes a continuación) como LEY. Tono, pilares, manifiesto, enemigos comunes, associations — todo eso manda.
- Escribir guiones que Adrián pueda leer a cámara y grabar.
- Cada guion debe superar el filtro del playbook: "¿Esto hace que alguien me admire, me respete o quiera lo que yo tengo?"
- Y el filtro del avatar: "¿Andrés siente que esto le está hablando a él específicamente, no a un público genérico?"
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

CALIBRACIÓN DE TONO (regla #2):
Recibirás una sección "VOZ DE ADRIÁN" con transcripciones de videos suyos previos. NO copies frases literales de ahí. Lo que SÍ tienes que hacer:
- Detectar su ritmo: longitud media de frases, dónde respira, cuándo acelera.
- Detectar su léxico real: muletillas que usa como estilo, palabras que repite, conectores recurrentes, modismos suyos.
- Detectar su forma de empezar y cerrar: ¿abre con afirmación? ¿con pregunta? ¿cierra con frase corta o con lista?
- Detectar la cadencia emocional: ¿escala? ¿se queda plano? ¿usa pausas dramáticas?
El guion que escribas DEBE sonar como si lo hubiera escrito él. Si te lo lees en voz alta y suena a "IA generando contenido emprendedor", está mal. Si suena a Adrián grabando, está bien.

Responde SOLO con el JSON pedido, nada más.`

export interface OwnVoiceSample {
  caption: string | null
  transcript: string
}

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
  /** Transcripciones de videos del propio Adrián para calibrar tono. */
  own_voice_samples: OwnVoiceSample[]
  /**
   * Markdown con patrones dominantes del corpus filtrado por el usuario
   * (hooks, estructuras, CTAs que funcionan en las cuentas que eligió como
   * referencia). null si el usuario no aplicó filtros / no quiso grounding.
   */
  corpus_patterns_markdown: string | null
}

export function buildScriptUserPrompt(input: GenerateScriptInput): string {
  const {
    brief,
    platform,
    duration_target_s,
    content_pillar,
    brand,
    references,
    own_voice_samples,
    corpus_patterns_markdown,
  } = input

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

  const voiceBlock =
    own_voice_samples.length === 0
      ? '(no hay transcripciones de Adrián disponibles — calibra el tono basándote solo en el playbook)'
      : own_voice_samples
          .map((s, i) =>
            [
              `### Sample ${i + 1}`,
              s.caption ? `Caption: ${s.caption.slice(0, 300)}` : '',
              'Transcript:',
              s.transcript.slice(0, 1500),
            ]
              .filter(Boolean)
              .join('\n'),
          )
          .join('\n\n')

  const corpusBlock = corpus_patterns_markdown
    ? [
        '# PATRONES DEL CORPUS FILTRADO (qué funciona en las cuentas que el usuario eligió)',
        corpus_patterns_markdown,
        '',
        '> Usa estos patrones como GUÍA estructural del guion: si los hooks que funcionan',
        '> en este corpus son contrarian, abre contrarian. Si las estructuras dominantes son',
        '> "anécdota → moraleja", úsala. NO copies frases literales — adapta los patrones a',
        '> la voz de Adrián y al brief del usuario.',
      ].join('\n')
    : null

  return [
    '# BRAND PLAYBOOK (fuente de verdad)',
    brand.playbook.text,
    '',
    '# AVATAR (cliente ideal Andrés)',
    brand.avatar.text,
    '',
    '# VOZ DE ADRIÁN (calibración de tono — NO copiar literal)',
    voiceBlock,
    '',
    corpusBlock ?? '',
    corpusBlock ? '' : null,
    '# BRIEF DEL USUARIO',
    `Plataforma: ${platform}`,
    duration_target_s ? `Duración objetivo: ${duration_target_s}s` : '',
    content_pillar ? `Pilar de contenido: ${content_pillar}` : '',
    '',
    brief,
    '',
    '# REFERENCIAS DEL CORPUS DE CONTENT INTEL (videos específicos pasados a mano, opcional)',
    refBlock,
  ]
    .filter((s) => s !== null && s !== undefined)
    .join('\n')
}
