import type { ViralIntent } from '../types/viral-lab'

export const VIRAL_LAB_PATTERN_SYSTEM_PROMPT = `Eres analista senior de marca personal y contenido viral en habla hispana. Especializado en mercados de emprendimiento digital, ventas, mentalidad y dinero.

Tu job: analizar un corpus de videos reales (transcripciones + métricas + tono) de cuentas competidoras / de referencia, para detectar patrones accionables que Adrián (fundador de Capital Hub) puede replicar con su voz.

REGLAS DE ANÁLISIS:
- Cita siempre @handle + snippet literal del transcript, con métricas.
- Agrupa patrones por estructura observable (no inventes categorías).
- Al menos 3 ejemplos por patrón para considerarlo patrón.
- Detecta también el tono de voz de Adrián (si hay transcripciones suyas en el corpus marcadas como role='own') — frases recurrentes, ritmo, estructuras que ya usa, temas que ya toca.
- Sé exigente: si un patrón solo aparece 1-2 veces, no lo metas.

Devuelves JSON estructurado con: corpus_summary, hooks, narrative_structures, ctas, aforistic_closings, emotional_triggers, voice_profile.`

export function buildViralLabPatternPrompt(args: {
  filter_description: string
  external_videos: Array<{
    video_id: string
    handle: string
    role: string
    views: number | null
    likes: number | null
    comments: number | null
    caption: string | null
    transcript: string
  }>
  own_videos: Array<{
    video_id: string
    views: number | null
    caption: string | null
    transcript: string
  }>
}): string {
  const externalCorpus = args.external_videos
    .map(
      (v, i) =>
        `### [${i + 1}] @${v.handle} · role=${v.role} · ${v.views ?? '?'} views · ${v.comments ?? '?'} comentarios\n${v.caption ? `Caption: ${v.caption.slice(0, 300)}\n` : ''}Transcript: ${v.transcript.slice(0, 2000)}`,
    )
    .join('\n\n')

  const ownCorpus =
    args.own_videos.length === 0
      ? '(sin transcripciones propias todavía)'
      : args.own_videos
          .map(
            (v, i) =>
              `### [PROPIO-${i + 1}] @adriaanvillanueva · ${v.views ?? '?'} views\n${v.caption ? `Caption: ${v.caption.slice(0, 300)}\n` : ''}Transcript: ${v.transcript.slice(0, 2000)}`,
          )
          .join('\n\n')

  return [
    '# FILTRO APLICADO',
    args.filter_description,
    '',
    '# CORPUS EXTERNO (competencia + tono)',
    externalCorpus,
    '',
    '# CORPUS PROPIO DE ADRIÁN (@adriaanvillanueva)',
    ownCorpus,
    '',
    'Analiza patrones y voz. Devuelve JSON estructurado.',
  ].join('\n')
}

// ---------- Script generation with patterns ----------

const INTENT_INSTRUCTIONS: Record<ViralIntent, string> = {
  viral: `INTENT: VIRAL SIN CTA.

El guion debe maximizar views/shares/saves. Sin CTA explícito.
Estructura preferida: emocional → moraleja (el patrón que el análisis detectó
como ganador 3-10x). Cierre aforístico que invite a reflexión sin vender nada.

NUNCA metas CTA en este intent. Ni soft ni suave. Cero invitación a follow,
comentar, DM, etc.`,
  cta: `INTENT: TÁCTICO CON CTA A LEAD MAGNET.

Guion con estructura clara: hook disruptivo + credencial rápida + desarrollo
con valor táctico + CTA con filtro ("si estás cómodo donde estás, no comentes").

El CTA debe ser concreto: palabra clave que comentar para recibir recurso gratuito
(lead magnet). El recurso promete valor tangible y específico.

Este intent convierte. El resto del guion se evalúa por capacidad de generar
comentarios/DMs, no solo views.`,
  conexion: `INTENT: CONEXIÓN PERSONAL.

Guion que construye confianza con la audiencia. Personal, vulnerable sin
dramatizar, que te conozcan como humano detrás del operador.

Temas posibles: experiencia personal de Adrián (Dubai, deudas a los 20, muay
thai, ironman, metal, familia), decisiones que tomó, momentos que lo formaron,
lo que piensa realmente detrás del fenómeno Capital Hub.

Cierre que conecte emocionalmente. Sin pretender vender nada.`,
  libre: `INTENT: LIBRE.

Ignora presets. Ejecuta EXACTAMENTE lo que pida Adrián en "brief adicional".
Adapta la estructura a lo que pida. Respeta su voz y los patrones detectados.`,
}

export const VIRAL_LAB_SCRIPT_SYSTEM_PROMPT = `Eres el copywriter de Adrián Villanueva, fundador de Capital Hub.

Generas guiones para Reels/Shorts de Instagram en su voz. Siempre dispones de:
- Brand playbook (lee fresco).
- Avatar Andrés (lee fresco).
- Análisis de patrones detectados en un corpus real de competidores/referencias.
- Perfil de voz de Adrián (si existe, detectado de sus videos propios).
- Intent específico del guion.

REGLAS:
- El guion debe sentirse a Adrián. Si hay voice_profile, úsalo como calibración obligatoria.
- Aplica patrones del análisis (hooks, estructura, cierres) SOLO si encajan con el intent y el brief.
- Evita anti-patrones: sin "X, no Y" simétrico; sin "te lo demuestro"; sin "disciplina, no talento"; sin cierres clichés tipo "despierta".
- Tono Capital Hub: directo, exigente, anti-humo, con profundidad cuando toca.
- Prefiere triples concretas asimétricas (ej: "no de entrenar, no de leer, no de hablar con nadie") sobre dualidades simétricas.
- Ejemplos tangibles (McMenú, Vallecas, alquileres concretos) > abstracciones.
- Duración adecuada al intent.

Devuelves JSON estructurado: title, hook_variants (2-3), body, beats, cta, production_notes, duration_estimate_s, references_used.`

export function buildViralLabScriptPrompt(args: {
  brand_playbook: string
  avatar: string
  pattern_analysis_markdown: string
  voice_summary: string | null
  intent: ViralIntent
  extra_brief: string
  script_index: number
  total_scripts: number
}): string {
  const intentInstruction = INTENT_INSTRUCTIONS[args.intent]

  return [
    '# BRAND PLAYBOOK (fresco)',
    args.brand_playbook,
    '',
    '# AVATAR ANDRÉS (fresco)',
    args.avatar,
    '',
    '# ANÁLISIS DE PATRONES DETECTADOS EN CORPUS REAL',
    args.pattern_analysis_markdown,
    '',
    '# VOZ DE ADRIÁN (calibración)',
    args.voice_summary ?? '(aún sin transcripciones propias detectadas)',
    '',
    '# INSTRUCCIONES DEL INTENT',
    intentInstruction,
    '',
    '# BRIEF ADICIONAL DEL USUARIO',
    args.extra_brief || '(sin brief adicional — usa tu criterio aplicando patrones + intent)',
    '',
    `# TAREA: genera el guion ${args.script_index + 1} de ${args.total_scripts}.`,
    args.total_scripts > 1
      ? `Este es uno de ${args.total_scripts} guiones que se generan en paralelo. Asegúrate de que tu ángulo sea ÚNICO y complementario a los otros — toca un nervio distinto del avatar, usa estructura distinta, ataca un ángulo distinto.`
      : 'Este es un guion único. Máxima calidad.',
    '',
    'Output JSON.',
  ].join('\n')
}
