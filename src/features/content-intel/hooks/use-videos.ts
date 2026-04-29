'use client'

import { useCallback, useEffect, useState } from 'react'
import type { VideoRow } from '../types/video'
import type { VideoFilters } from '../store/content-intel-store'

interface UseVideosResult {
  videos: VideoRow[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

function filtersToQuery(filters: VideoFilters, limit = 200): string {
  const q = new URLSearchParams()
  if (filters.account_ids.length > 0) q.set('account_ids', filters.account_ids.join(','))
  if (filters.platform) q.set('platform', filters.platform)
  if (filters.min_views !== null) q.set('min_views', String(filters.min_views))
  if (filters.has_transcript === 'yes') q.set('has_transcript', 'true')
  if (filters.has_transcript === 'no') q.set('has_transcript', 'false')
  q.set('order_by', filters.order_by)
  q.set('order_dir', filters.order_dir)
  q.set('limit', String(limit))
  return q.toString()
}

export function useVideos(filters: VideoFilters): UseVideosResult {
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const qs = filtersToQuery(filters)

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/content-intel/videos?${qs}`, {
          cache: 'no-store',
          signal,
        })
        const json = await res.json()
        if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
        if (!signal?.aborted) setVideos(json.videos as VideoRow[])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [qs],
  )

  useEffect(() => {
    const ctrl = new AbortController()
    void refresh(ctrl.signal)
    return () => ctrl.abort()
  }, [refresh])

  return { videos, loading, error, refresh }
}

export function useVideo(videoId: string | null) {
  const [video, setVideo] = useState<VideoRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!videoId) {
      setVideo(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/content-intel/videos/${videoId}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setVideo(json.video as VideoRow)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { video, loading, error, refresh }
}
