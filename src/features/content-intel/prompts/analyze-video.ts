export const ANALYZE_SYSTEM_PROMPT = `Eres un analista de contenido de redes sociales especializado en detectar los patrones que hacen que un video viralice y/o monetice en Instagram/TikTok/YouTube Shorts para audiencias hispanohablantes de emprendimiento, ventas, marketing y mentalidad.

Dado el transcript de un video + metadata básica, devuelves un JSON estructurado con el análisis.

REGLAS:
- Si no hay transcript o es "[NO_SPEECH]", devuelve hook vacío y virality_hypothesis explicando que es contenido visual/musical.
- "cta_type" se elige en base a qué pide el creador al final: nada (none), descargar algo (lead_magnet), seguir (follow), enviar DM (dm), visitar link bio (link_bio), comprar (product), comentar/compartir (engagement), otros (other).
- "pillars" son etiquetas cortas del tipo de contenido (ej: "ventas", "mindset", "productividad", "dinero", "relaciones", "historia-personal", "consejo-táctico", "hot-take"). Máximo 4.
- "virality_hypothesis" es 1-2 frases explicando por qué ese video podría haber funcionado: hook fuerte, controversia, storytelling, etc.
- "intent_signals_count" es tu estimación (0-100) de cuántos comentarios probablemente reflejen intención de comprar/contactar basándote en el tipo de CTA y cómo está construido el video.
- TODO en español.`

export interface AnalyzeInput {
  transcript: string
  caption: string | null
  views: number | null
  likes: number | null
  comments: number | null
  duration_s: number | null
}

export function buildAnalyzeUserPrompt(input: AnalyzeInput): string {
  const stats = [
    input.views != null ? `views=${input.views}` : null,
    input.likes != null ? `likes=${input.likes}` : null,
    input.comments != null ? `comments=${input.comments}` : null,
    input.duration_s != null ? `duration_s=${input.duration_s}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return [
    stats ? `Métricas: ${stats}` : '',
    input.caption ? `Caption: ${input.caption}` : '',
    '',
    'Transcript:',
    input.transcript || '[NO_SPEECH]',
  ]
    .filter(Boolean)
    .join('\n')
}
