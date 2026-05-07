import { config } from 'dotenv'
import Replicate from 'replicate'
import fs from 'node:fs/promises'
import path from 'node:path'

config({ path: '.env.local' })

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

const PROMPT = `Aerial drone shot, perfect top-down 90 degree overhead view, vertical 9:16 framing, of a large urban park lawn during golden hour summer evening. Dozens of small groups of people sitting and lying on colorful picnic blankets scattered densely across vast green grass — couples, groups of friends, families, individuals reading. Long warm golden shadows stretch across the grass from the low sun. Very slow gentle drone descent with subtle pan, almost static. Photorealistic, cinematic, sharp focus, vibrant green grass, warm golden sunlight, natural depth of field. Looks like Brooklyn Prospect Park, Domino Park or Madrid Retiro on a Saturday evening in summer. People are mostly sitting or lying on blankets, not walking. High resolution, ultra realistic.`

const NEGATIVE = 'text, watermark, logo, captions, subtitles, cartoonish style, low quality, distorted bodies, deformed limbs, fast motion, motion blur, zoom in fast, vertical buildings, indoor scene, beach, water, ocean, river'

async function main() {
  console.log('[veo-3-fast] Lanzando predicción...')
  const start = Date.now()

  const output = await replicate.run('google/veo-3-fast', {
    input: {
      prompt: PROMPT,
      negative_prompt: NEGATIVE,
      aspect_ratio: '9:16',
      duration: 8,
      enhance_prompt: true,
    },
  })

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`[veo-3-fast] Listo en ${elapsed}s.`)

  const videoUrl = typeof output === 'string' ? output : Array.isArray(output) ? output[0] : output?.url?.()
  if (!videoUrl) {
    console.error('[veo-3-fast] Output inesperado:', output)
    process.exit(1)
  }
  console.log('[veo-3-fast] URL:', String(videoUrl))

  const outPath = path.resolve(process.cwd(), 'public/raw/parque-aereo-ai.mp4')
  await fs.mkdir(path.dirname(outPath), { recursive: true })

  const res = await fetch(String(videoUrl))
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(outPath, buf)
  console.log(`[veo-3-fast] Guardado en ${outPath} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`)
}

main().catch((err) => {
  console.error('[veo-3-fast] ERROR:', err?.message ?? err)
  process.exit(1)
})
