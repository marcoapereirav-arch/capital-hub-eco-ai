import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { spawn } from 'child_process'
import http from 'http'
import path from 'path'
import fs from 'fs/promises'
import { createReadStream, statSync } from 'fs'
import os from 'os'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { createAdminClient } from '@/lib/supabase/admin'
import { VIDEO_EDIT_BUCKET } from './storage'
import type { VerticalCleanProps } from '@/remotion/compositions/VerticalClean'

/**
 * Re-codifica el video aplicando la rotación de metadata (display matrix).
 * Resultado: archivo orientado correctamente sin necesidad de CSS rotate.
 */
async function bakeRotationWithFfmpeg(inputPath: string, editId: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `remotion-baked-${editId}.mp4`)
  return new Promise((resolve, reject) => {
    // ffmpeg por defecto aplica display matrix al re-encodear (auto-rotation).
    // Le decimos que limpie metadata para que Remotion no la re-aplique encima.
    const args = [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'ultrafast', // priorizamos velocidad sobre tamaño
      '-crf', '20',
      '-c:a', 'aac',
      '-b:a', '128k',
      // Limpiar metadata de rotación (ya está aplicada en pixels tras re-encode)
      '-metadata:s:v:0', 'rotate=0',
      outputPath,
    ]
    const proc = spawn(ffmpegInstaller.path, args)
    let stderr = ''
    proc.stderr.on('data', (chunk) => (stderr += chunk.toString()))
    proc.on('close', (code) => {
      if (code === 0) resolve(outputPath)
      else reject(new Error(`ffmpeg bake failed (${code}): ${stderr.slice(-500)}`))
    })
  })
}

async function downloadSourceLocally(remoteUrl: string, editId: string): Promise<string> {
  const localPath = path.join(os.tmpdir(), `remotion-src-${editId}.mp4`)
  const res = await fetch(remoteUrl)
  if (!res.ok || !res.body) {
    throw new Error(`source download failed: HTTP ${res.status}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(localPath, buffer)
  return localPath
}

/**
 * Mini HTTP server que sirve un archivo local. Remotion exige http(s):// como src,
 * así que envolvemos el archivo descargado en un servidor efímero.
 * Soporta range requests (necesario para que Remotion seekee dentro del video).
 */
function startLocalFileServer(filePath: string): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const stat = statSync(filePath)
        const total = stat.size
        const range = req.headers.range
        if (range) {
          const match = /bytes=(\d+)-(\d+)?/.exec(range)
          const start = match ? parseInt(match[1], 10) : 0
          const end = match && match[2] ? parseInt(match[2], 10) : total - 1
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': 'video/mp4',
          })
          createReadStream(filePath, { start, end }).pipe(res)
        } else {
          res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
          })
          createReadStream(filePath).pipe(res)
        }
      } catch (err) {
        res.writeHead(500)
        res.end(err instanceof Error ? err.message : 'unknown')
      }
    })
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        throw new Error('local server failed to bind')
      }
      resolve({
        url: `http://127.0.0.1:${addr.port}/source.mp4`,
        close: () => server.close(),
      })
    })
  })
}

/**
 * Render Remotion local: bundlea la composición, selecciona y renderiza a MP4.
 * Después sube el output a Supabase Storage y devuelve la URL pública.
 */

let cachedBundle: string | null = null

async function getBundle(): Promise<string> {
  if (cachedBundle) return cachedBundle
  const projectRoot = process.cwd()
  const entryPoint = path.join(projectRoot, 'src/remotion/index.ts')
  const bundleLocation = await bundle({
    entryPoint,
    onProgress: (progress) => {
      if (progress % 25 === 0) {
        console.log(`[remotion] bundling: ${progress}%`)
      }
    },
    webpackOverride: (config) => config,
  })
  cachedBundle = bundleLocation
  return bundleLocation
}

export interface RemotionRenderInput {
  editId: string
  compositionId: 'vertical-clean'
  inputProps: VerticalCleanProps
}

export interface RemotionRenderOutput {
  outputUrl: string
  bucketPath: string
  durationSeconds: number
}

export async function renderRemotionAndUpload(
  input: RemotionRenderInput,
): Promise<RemotionRenderOutput> {
  const bundleLocation = await getBundle()

  // Pre-descargar el source local
  console.log(`[remotion] downloading source video locally for ${input.editId}...`)
  const localSourcePath = await downloadSourceLocally(
    input.inputProps.sourceVideoUrl,
    input.editId,
  )

  // Re-codificar con ffmpeg para BAKEAR la rotación en pixels (más limpio que
  // CSS rotate). El output queda correctamente orientado y Remotion no necesita
  // transform. También reduce tamaño y lo hace más amigable para frame-seek.
  console.log(`[remotion] baking rotation with ffmpeg for ${input.editId}...`)
  const bakedPath = await bakeRotationWithFfmpeg(localSourcePath, input.editId)
  await fs.unlink(localSourcePath).catch(() => {})

  // Levantar mini HTTP server local que sirva el archivo (Remotion exige http://)
  const localServer = await startLocalFileServer(bakedPath)
  const propsForRender: VerticalCleanProps = {
    ...input.inputProps,
    sourceVideoUrl: localServer.url,
    // Rotación ya bakeada → no necesitamos transform CSS
    rotationDegrees: 0,
  }

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: input.compositionId,
    inputProps: propsForRender,
  })

  const outputPath = path.join(os.tmpdir(), `remotion-${input.editId}.mp4`)

  console.log(
    `[remotion] rendering ${input.editId} · composition=${composition.id} · ` +
      `${composition.durationInFrames} frames @ ${composition.fps}fps`,
  )

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: propsForRender,
    // 5 min por frame es generoso para que el local file server tenga margen
    // descargando chunks de un 547 MB en seek aleatorio.
    timeoutInMilliseconds: 5 * 60 * 1000,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100)
      if (pct % 20 === 0) console.log(`[remotion] ${input.editId} render: ${pct}%`)
    },
  })

  // Cleanup
  localServer.close()
  await fs.unlink(bakedPath).catch(() => {})

  const outputBuffer = await fs.readFile(outputPath)
  const bucketPath = `edited/${input.editId}.mp4`

  const supabase = createAdminClient()
  const { error: uploadErr } = await supabase.storage
    .from(VIDEO_EDIT_BUCKET)
    .upload(bucketPath, outputBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    })

  if (uploadErr) {
    throw new Error(`upload edited mp4 failed: ${uploadErr.message}`)
  }

  // Limpiar archivo temporal
  await fs.unlink(outputPath).catch(() => {})

  // URL firmada para que el navegador pueda descargar (24h de validez)
  const { data: signed, error: signedErr } = await supabase.storage
    .from(VIDEO_EDIT_BUCKET)
    .createSignedUrl(bucketPath, 60 * 60 * 24)

  if (signedErr || !signed) {
    throw new Error(`signed url failed: ${signedErr?.message ?? 'unknown'}`)
  }

  return {
    outputUrl: signed.signedUrl,
    bucketPath,
    durationSeconds: composition.durationInFrames / composition.fps,
  }
}
