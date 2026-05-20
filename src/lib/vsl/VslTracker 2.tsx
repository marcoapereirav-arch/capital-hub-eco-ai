"use client"

import { useEffect, useRef } from "react"
import { track } from "@/lib/meta/pixel-client"

/**
 * Escucha postMessage del player Panda Video y dispara eventos Meta
 * (Pixel + CAPI) en milestones: play, 25%, 50%, 75%, 100%.
 *
 * Los milestones evitan duplicados via sessionStorage (un play por sesión
 * dispara un único set de hits, refresh los reinicia).
 */

type Milestone = "play" | "25" | "50" | "75" | "100"

const STORAGE_PREFIX = "ch:vsl:"

function alreadyFired(videoId: string, m: Milestone): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(`${STORAGE_PREFIX}${videoId}:${m}`) === "1"
  } catch {
    return false
  }
}

function markFired(videoId: string, m: Milestone) {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${videoId}:${m}`, "1")
  } catch {
    // sessionStorage puede fallar en private mode; no es crítico
  }
}

function fireMilestone(videoId: string, m: Milestone, contentName: string) {
  if (alreadyFired(videoId, m)) return
  markFired(videoId, m)

  const eventName = `mifge_vsl_${m}`
  // 50% y 100% también disparan ViewContent estándar (Meta optimiza mejor)
  const standardEvent = m === "50" || m === "100" ? "ViewContent" : undefined
  track({
    event: eventName,
    standardEvent,
    contentName: `${contentName} ${m === "play" ? "play" : m + "%"}`,
    contentIds: [videoId],
    custom: { vsl_video_id: videoId, vsl_milestone: m },
  }).catch(() => {})
}

export function VslTracker({ videoId, contentName = "MIFGE VSL" }: { videoId: string; contentName?: string }) {
  const lastPctRef = useRef(0)

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      // Filtra mensajes que no son del player Panda
      if (typeof ev.data !== "object" || ev.data == null) return
      const data = ev.data as { message?: string; event?: string; currentTime?: number; duration?: number }
      const evt = data.message ?? data.event
      if (!evt || typeof evt !== "string" || !evt.startsWith("panda_")) return

      const currentTime = typeof data.currentTime === "number" ? data.currentTime : null
      const duration = typeof data.duration === "number" ? data.duration : null

      if (evt === "panda_play") {
        fireMilestone(videoId, "play", contentName)
        return
      }
      if (evt === "panda_ended") {
        fireMilestone(videoId, "100", contentName)
        return
      }
      if ((evt === "panda_progress" || evt === "panda_timeupdate") && currentTime != null && duration && duration > 0) {
        const pct = (currentTime / duration) * 100
        if (pct < lastPctRef.current) return // ignora seeks atrás
        lastPctRef.current = pct
        if (pct >= 25) fireMilestone(videoId, "25", contentName)
        if (pct >= 50) fireMilestone(videoId, "50", contentName)
        if (pct >= 75) fireMilestone(videoId, "75", contentName)
        if (pct >= 95) fireMilestone(videoId, "100", contentName)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [videoId, contentName])

  return null
}
