import { spawn } from 'child_process'
// @ts-expect-error - ffprobe-static no tiene tipos
import ffprobeStatic from 'ffprobe-static'

/**
 * Detecta metadatos del video usando ffprobe (ffprobe-static).
 *
 * Lo usamos para auto-detectar la rotación del iPhone HEVC vertical:
 * el archivo viene en bytes 1920x1080 (landscape sensor) con metadata
 * "rotate=90" (o "side_data_list.rotation=-90"). ffmpeg/ffprobe lo detecta.
 */

export interface VideoMetadata {
  /** Rotación que el video DEBE aplicarse al display (0/90/180/270 grados). */
  rotationDegrees: 0 | 90 | 180 | 270
  /** Ancho en pixels del frame nativo. */
  width: number
  /** Alto en pixels del frame nativo. */
  height: number
  /** Duración total en segundos. */
  duration: number
  /** Codec del video (h264, hevc, etc). */
  codec: string
}

interface FFProbeStream {
  codec_type?: string
  codec_name?: string
  width?: number
  height?: number
  duration?: string
  tags?: { rotate?: string }
  side_data_list?: Array<{ rotation?: number }>
}

interface FFProbeResult {
  streams?: FFProbeStream[]
  format?: { duration?: string }
}

export async function probeVideo(url: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const ffprobePath = ffprobeStatic.path
    const args = [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_streams',
      '-show_format',
      url,
    ]

    const proc = spawn(ffprobePath, args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (chunk) => (stdout += chunk.toString()))
    proc.stderr.on('data', (chunk) => (stderr += chunk.toString()))

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed (code ${code}): ${stderr.slice(0, 500)}`))
        return
      }
      try {
        const data: FFProbeResult = JSON.parse(stdout)
        const videoStream = (data.streams ?? []).find((s) => s.codec_type === 'video')
        if (!videoStream) {
          reject(new Error('No video stream found'))
          return
        }

        // Detectar rotación. iPhone HEVC almacena 1920x1080 landscape con
        // metadata "rotate this for correct display":
        //   tags.rotate=90 → rotar 90° CW para verlo bien
        //   side_data_list[].rotation=-90 → mismo significado, signo invertido
        //
        // CSS `transform: rotate(Xdeg)` rota X grados clockwise (positivo).
        // Necesitamos el ángulo CSS positivo equivalente.
        let cssRotation = 0
        if (videoStream.tags?.rotate) {
          // iPhone tag YA viene en grados clockwise (lo que CSS necesita)
          cssRotation = parseInt(videoStream.tags.rotate, 10)
        } else if (videoStream.side_data_list) {
          const rot = videoStream.side_data_list.find((sd) => sd.rotation != null)
          if (rot && typeof rot.rotation === 'number') {
            // ffprobe side_data: signo invertido respecto al tag.
            // -90 (side_data) === 90 (tag) === rotate 90° CW
            cssRotation = -rot.rotation
          }
        }
        // Normalizar al rango 0-360
        cssRotation = ((cssRotation % 360) + 360) % 360
        const normalized: 0 | 90 | 180 | 270 =
          cssRotation === 90 || cssRotation === 180 || cssRotation === 270
            ? (cssRotation as 90 | 180 | 270)
            : 0

        const rotationDegrees: 0 | 90 | 180 | 270 = normalized
        resolve({
          rotationDegrees,
          width: videoStream.width ?? 0,
          height: videoStream.height ?? 0,
          duration: parseFloat(videoStream.duration ?? data.format?.duration ?? '0'),
          codec: videoStream.codec_name ?? 'unknown',
        })
      } catch (err) {
        reject(new Error(`ffprobe parse failed: ${err instanceof Error ? err.message : 'unknown'}`))
      }
    })
  })
}
