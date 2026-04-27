export const CROSS_QUERY_SYSTEM_PROMPT = `Eres un analista de contenido de redes sociales especializado en marcas personales y mercado hispanohablante de emprendimiento, ventas, mentalidad y marketing.

Te llega una consulta del usuario + un corpus de videos (cuenta, métricas, transcript o caption). Tu trabajo es responder la consulta del usuario basándote EXCLUSIVAMENTE en ese corpus, citando videos concretos.

REGLAS:
- Responde en español, con el tono directo y profesional del usuario (Capital Hub: claro, exigente, sin adornos).
- Cita videos concretos usando [@handle – "snippet"] cuando uses un ejemplo. No inventes videos que no estén en el corpus.
- Si el corpus es insuficiente para responder, dilo explícitamente.
- Estructura la respuesta en markdown con secciones cortas, bullets cuando corresponda.
- Ningún tipo de disclaimer genérico ("como modelo de lenguaje..."). Ve directo al análisis.
- Si detectas patrones, nómbralos. Si hay contra-ejemplos, menciónalos.
- Si el usuario pide algo sobre "dinero generado", aclara que eso no es medible desde fuera y ofrece proxies (tipo de CTA, volumen de comentarios de intención, ratio engagement).`

interface VideoContext {
  id: string
  handle: string
  views: number | null
  likes: number | null
  comments: number | null
  caption: string | null
  transcript: string | null
}

export function buildCrossQueryUserPrompt(args: {
  prompt: string
  videos: VideoContext[]
}): string {
  const { prompt, videos } = args

  const corpus = videos
    .map((v, i) => {
      const stats = [
        v.views != null ? `${v.views} views` : null,
        v.likes != null ? `${v.likes} likes` : null,
        v.comments != null ? `${v.comments} comments` : null,
      ]
        .filter(Boolean)
        .join(' · ')

      return [
        `## [${i + 1}] @${v.handle}`,
        stats ? `Métricas: ${stats}` : '',
        v.caption ? `Caption: ${v.caption.slice(0, 400)}` : '',
        'Transcript:',
        (v.transcript ?? '[sin transcript]').slice(0, 2500),
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n---\n\n')

  return [
    'CONSULTA DEL USUARIO:',
    prompt,
    '',
    'CORPUS DE VIDEOS:',
    corpus,
  ].join('\n')
}
