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
 * Descarga el video remoto a disco local con streaming + retry.
 * Usar esta vía es más robusta que ffmpeg leyendo HTTP directo (Supabase corta
 * conexiones largas).
 */
async function downloadSourceLocally(remoteUrl: string, editId: string): Promise<string> {
  const localPath = path.join(os.tmpdir(), `remotion-src-${editId}.mp4`)
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[remotion] downloading source (attempt ${attempt}/${maxAttempts})...`)
      const res = await fetch(remoteUrl)
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }
      // Stream a disco en lugar de cargar todo en memoria
      const writer = (await import('fs')).createWriteStream(localPath)
      const reader = res.body.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          writer.write(value)
        }
      } finally {
        writer.end()
      }
      // Esperar a que se cierre el writer
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve())
        writer.on('error', reject)
      })
      const stat = (await import('fs')).statSync(localPath)
      console.log(`[remotion] downloaded ${(stat.size / 1024 / 1024).toFixed(1)} MB`)
      return localPath
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown'
      console.warn(`[remotion] download attempt ${attempt} failed: ${msg}`)
      if (attempt === maxAttempts) {
        throw new Error(`source download failed after ${maxAttempts} attempts: ${msg}`)
      }
      await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
  throw new Error('unreachable')
}

/**
 * Re-codifica el video aplicando la rotación de metadata (display matrix).
 * Resultado: archivo orientado correctamente sin necesidad de CSS rotate.
 */
async function bakeRotationWithFfmpeg(inputPath: string, editId: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `remotion-baked-${editId}.mp4`)
  return new Promise((resolve, reject) => {
    // ffmpeg por defecto aplica display matrix al re-encodear (auto-rotation).
    // Optimizaciones para Remotion seek rápido:
    //   -vf scale: limita a max 1920px lado largo (4K→1080p para seek rápido)
    //   -movflags faststart: header al inicio, seek instantáneo
    //   -g 30: keyframe cada 1s (vs 10s default), seeks más rápidos
    //   -pix_fmt yuv420p: compatibilidad universal de browsers
    const args = [
      '-y',
      '-i', inputPath,
      '-vf', "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease",
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-g', '30',
      '-movflags', '+faststart',
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

/**
 * Re-codifica el video DIRECTO desde la URL remota — ffmpeg soporta HTTP nativo.
 * Evita el step intermedio de buffering 547 MB en memoria que estaba timing out.
 */
async function bakeRotationFromUrl(remoteUrl: string, editId: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `remotion-baked-${editId}.mp4`)
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', remoteUrl,
      '-vf', "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease",
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-g', '30',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-metadata:s:v:0', 'rotate=0',
      outputPath,
    ]
    const proc = spawn(ffmpegInstaller.path, args)
    let stderr = ''
    proc.stderr.on('data', (chunk) => {
      const txt = chunk.toString()
      stderr += txt
      // Log progreso ffmpeg cada 10s aprox
      const m = txt.match(/time=([0-9:.]+)/)
      if (m && Math.random() < 0.05) {
        console.log(`[remotion] ffmpeg bake progress: ${m[1]}`)
      }
    })
    proc.on('close', (code) => {
      if (code === 0) resolve(outputPath)
      else reject(new Error(`ffmpeg bake failed (${code}): ${stderr.slice(-500)}`))
    })
  })
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

  // 1) Descargar source local con streaming + retry (más robusto que ffmpeg-from-URL)
  const localSourcePath = await downloadSourceLocally(
    input.inputProps.sourceVideoUrl,
    input.editId,
  )

  // 2) Bakear rotación + comprimir a 1080p faststart sobre el archivo local
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
